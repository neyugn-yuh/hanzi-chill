import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import crypto from "crypto";

const hashPassword = (pw) => crypto.createHash("sha256").update(pw).digest("hex");

// ─── DB config (only password from env) ────────────────────

const DB_CONFIG = {
  host: "79.127.235.187",
  port: 1026,
  user: "u8172_GnVHgwY0fa",
  password: process.env.DB_PASSWORD || "",
  database: "s8172_hanzi",
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
  connectTimeout: 10000,
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

// ─── Initialize tables ────────────────────────────────────

async function ensureTables() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS levels (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS translation_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      vietnamese TEXT NOT NULL,
      chinese TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      word_type VARCHAR(100) DEFAULT '',
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sentence_translation_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      vietnamese_sentence TEXT NOT NULL,
      chinese_sentence TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sentence_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      correct_sentence TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      vietnamese_meaning TEXT NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INT PRIMARY KEY DEFAULT 1,
      password_hash VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed admin password if not exists
  const [adminRows] = await db.query("SELECT COUNT(*) AS c FROM admin_settings");
  if (adminRows[0].c === 0) {
    await db.query(
      "INSERT INTO admin_settings (id, password_hash) VALUES (1, ?)",
      [hashPassword("admin123")],
    );
  }

  // Seed levels if empty
  const [rows] = await db.query("SELECT COUNT(*) AS c FROM levels");
  if (rows[0].c === 0) {
    await seedDefaultData(db);
  }
}

// ─── Seed default data ───────────────────────────────────

async function seedDefaultData(db) {
  const levels = [
    ["hsk1", "HSK 1", 0],
    ["hsk2", "HSK 2", 1],
    ["hsk3", "HSK 3", 2],
    ["hsk4", "HSK 4", 3],
    ["hsk5", "HSK 5", 4],
    ["hsk6", "HSK 6", 5],
  ];
  for (const row of levels) {
    await db.query(
      "INSERT INTO levels (id, name, sort_order) VALUES (?, ?, ?)",
      row,
    );
  }

  const trans = [
    ["t1", "hsk1", "Xin chào", "你好", "nǐ hǎo"],
    ["t2", "hsk1", "Cảm ơn", "谢谢", "xiè xie"],
    ["t3", "hsk1", "Tạm biệt", "再见", "zài jiàn"],
    ["t4", "hsk1", "Tôi", "我", "wǒ"],
    ["t5", "hsk1", "Bạn", "你", "nǐ"],
    ["t6", "hsk1", "Họ", "他 / 她 / 它", "tā"],
    ["t7", "hsk1", "Người", "人", "rén"],
    ["t8", "hsk1", "Nước", "水", "shuǐ"],
    ["t1_hsk2", "hsk2", "Đã", "了", "le"],
    ["t2_hsk2", "hsk2", "Thời gian", "时间", "shí jiān"],
    ["t3_hsk2", "hsk2", "Học sinh", "学生", "xué sheng"],
    ["t4_hsk2", "hsk2", "Giáo viên", "老师", "lǎo shī"],
    ["t5_hsk2", "hsk2", "Sách", "书", "shū"],
  ];
  for (const row of trans) {
    await db.query(
      "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin) VALUES (?, ?, ?, ?, ?)",
      row,
    );
  }

  const sentTrans = [
    ["st1", "hsk1", "Bạn khỏe không?", "你好吗？", "nǐ hǎo ma?"],
    ["st2", "hsk1", "Tôi rất khỏe", "我很好", "wǒ hěn hǎo"],
    ["st3", "hsk1", "Cảm ơn bạn", "谢谢你", "xiè xie nǐ"],
    ["st4", "hsk1", "Hẹn gặp lại", "再见！", "zài jiàn!"],
    [
      "st1_hsk2",
      "hsk2",
      "Bây giờ mấy giờ rồi?",
      "现在几点？",
      "xiàn zài jǐ diǎn?",
    ],
    [
      "st2_hsk2",
      "hsk2",
      "Hôm nay thứ mấy?",
      "今天星期几？",
      "jīn tiān xīng qī jǐ?",
    ],
  ];
  for (const row of sentTrans) {
    await db.query(
      "INSERT INTO sentence_translation_exercises (id, level_id, vietnamese_sentence, chinese_sentence, pinyin) VALUES (?, ?, ?, ?, ?)",
      row,
    );
  }

  const sent = [
    ["s1", "hsk1", "你好吗", "nǐ hǎo ma", "Bạn khỏe không?"],
    ["s2", "hsk1", "我很好", "wǒ hěn hǎo", "Tôi rất khỏe"],
    ["s3", "hsk1", "谢谢你", "xiè xie nǐ", "Cảm ơn bạn"],
  ];
  for (const row of sent) {
    await db.query(
      "INSERT INTO sentence_exercises (id, level_id, correct_sentence, pinyin, vietnamese_meaning) VALUES (?, ?, ?, ?, ?)",
      row,
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────

async function getAllLevels() {
  const db = getPool();
  const [levels] = await db.query("SELECT * FROM levels ORDER BY sort_order");

  const result = [];
  for (const level of levels) {
    const [translationExercises] = await db.query(
      "SELECT id, vietnamese, chinese, pinyin, word_type AS wordType FROM translation_exercises WHERE level_id = ?",
      [level.id],
    );
    const [sentenceTranslationExercises] = await db.query(
      "SELECT id, vietnamese_sentence AS vietnameseSentence, chinese_sentence AS chineseSentence, pinyin FROM sentence_translation_exercises WHERE level_id = ?",
      [level.id],
    );
    const [sentenceExercises] = await db.query(
      "SELECT id, correct_sentence AS correctSentence, pinyin, vietnamese_meaning AS vietnameseMeaning FROM sentence_exercises WHERE level_id = ?",
      [level.id],
    );

    result.push({
      id: level.id,
      name: level.name,
      translationExercises,
      sentenceTranslationExercises,
      sentenceExercises,
    });
  }
  return result;
}

// ─── Express app ────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Ensure tables on first request
let isTablesReady = false;
app.use(async (_req, _res, next) => {
  if (!isTablesReady) {
    try {
      await ensureTables();
      isTablesReady = true;
    } catch (err) {
      console.error("DB init failed:", err.message);
    }
  }
  next();
});

// GET /api/levels
app.get("/api/levels", async (_req, res) => {
  try {
    const levels = await getAllLevels();
    res.json(levels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu" });
  }
});

// PUT /api/levels — Import toàn bộ
app.put("/api/levels", async (req, res) => {
  try {
    const { levels } = req.body;
    if (!Array.isArray(levels)) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
    }

    const db = getPool();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM translation_exercises");
      await conn.query("DELETE FROM sentence_translation_exercises");
      await conn.query("DELETE FROM sentence_exercises");
      await conn.query("DELETE FROM levels");

      for (let idx = 0; idx < levels.length; idx++) {
        const level = levels[idx];
        await conn.query(
          "INSERT INTO levels (id, name, sort_order) VALUES (?, ?, ?)",
          [level.id, level.name, idx],
        );
        for (const e of level.translationExercises || []) {
          await conn.query(
            "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin, word_type) VALUES (?, ?, ?, ?, ?, ?)",
            [
              e.id,
              level.id,
              e.vietnamese || "",
              e.chinese || "",
              e.pinyin || "",
              e.wordType || "",
            ],
          );
        }
        for (const e of level.sentenceTranslationExercises || []) {
          await conn.query(
            "INSERT INTO sentence_translation_exercises (id, level_id, vietnamese_sentence, chinese_sentence, pinyin) VALUES (?, ?, ?, ?, ?)",
            [
              e.id,
              level.id,
              e.vietnameseSentence || "",
              e.chineseSentence || "",
              e.pinyin || "",
            ],
          );
        }
        for (const e of level.sentenceExercises || []) {
          await conn.query(
            "INSERT INTO sentence_exercises (id, level_id, correct_sentence, pinyin, vietnamese_meaning) VALUES (?, ?, ?, ?, ?)",
            [
              e.id,
              level.id,
              e.correctSentence || "",
              e.pinyin || "",
              e.vietnameseMeaning || "",
            ],
          );
        }
      }
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
    const updated = await getAllLevels();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lưu dữ liệu" });
  }
});

// PUT /api/levels/reorder — Cập nhật thứ tự sắp xếp
app.put("/api/levels/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: "orderedIds phải là mảng không rỗng" });
    }
    const db = getPool();
    const promises = orderedIds.map((id, index) =>
      db.query("UPDATE levels SET sort_order = ? WHERE id = ?", [index, id])
    );
    await Promise.all(promises);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi cập nhật thứ tự" });
  }
});

// POST /api/levels — Tạo mới
app.post("/api/levels", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Tên cấp độ không được trống" });
    }
    const db = getPool();
    const id = `level_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const [maxRows] = await db.query("SELECT MAX(sort_order) AS m FROM levels");
    const sortOrder = (maxRows[0]?.m ?? -1) + 1;
    await db.query(
      "INSERT INTO levels (id, name, sort_order) VALUES (?, ?, ?)",
      [id, name.trim(), sortOrder],
    );
    const levels = await getAllLevels();
    res.status(201).json(levels.find((l) => l.id === id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi tạo cấp độ" });
  }
});

// PUT /api/levels/:id — Cập nhật
app.put("/api/levels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const db = getPool();
    const [existing] = await db.query("SELECT id FROM levels WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Cấp độ không tồn tại" });
    }
    if (name?.trim()) {
      await db.query("UPDATE levels SET name = ? WHERE id = ?", [
        name.trim(),
        id,
      ]);
    }
    const levels = await getAllLevels();
    res.json(levels.find((l) => l.id === id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi cập nhật cấp độ" });
  }
});

// DELETE /api/levels/:id
app.delete("/api/levels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPool();
    const [countRows] = await db.query("SELECT COUNT(*) AS c FROM levels");
    if (countRows[0].c <= 1) {
      return res.status(400).json({ error: "Phải có ít nhất 1 cấp độ" });
    }
    const [info] = await db.query("SELECT id FROM levels WHERE id = ?", [id]);
    if (info.length === 0) {
      return res.status(404).json({ error: "Cấp độ không tồn tại" });
    }
    await db.query("DELETE FROM levels WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi xóa cấp độ" });
  }
});

// ─── Exercise routes ────────────────────────────────────────

const exerciseRoutes = {
  translation: {
    table: "translation_exercises",
    fields: ["vietnamese", "chinese", "pinyin", "word_type"],
    map: (r) => ({
      id: r.id,
      vietnamese: r.vietnamese,
      chinese: r.chinese,
      pinyin: r.pinyin,
      wordType: r.word_type,
    }),
  },
  sentenceTranslation: {
    table: "sentence_translation_exercises",
    fields: ["vietnamese_sentence", "chinese_sentence", "pinyin"],
    map: (r) => ({
      id: r.id,
      vietnameseSentence: r.vietnamese_sentence,
      chineseSentence: r.chinese_sentence,
      pinyin: r.pinyin,
    }),
  },
  sentence: {
    table: "sentence_exercises",
    fields: ["correct_sentence", "pinyin", "vietnamese_meaning"],
    map: (r) => ({
      id: r.id,
      correctSentence: r.correct_sentence,
      pinyin: r.pinyin,
      vietnameseMeaning: r.vietnamese_meaning,
    }),
  },
};

// POST /api/exercises/:type
app.post("/api/exercises/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const config = exerciseRoutes[type];
    if (!config)
      return res.status(400).json({ error: "Loại bài tập không hợp lệ" });

    const { level_id, ...fields } = req.body;
    if (!level_id) return res.status(400).json({ error: "Thiếu level_id" });

    const db = getPool();
    const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const placeholders = ["id", "level_id", ...config.fields]
      .map(() => "?")
      .join(", ");
    const values = [
      id,
      level_id,
      ...config.fields.map((f) => (fields[f] || "").trim()),
    ];
    await db.query(
      `INSERT INTO ${config.table} (id, level_id, ${config.fields.join(", ")}) VALUES (${placeholders})`,
      values,
    );
    const [rows] = await db.query(
      `SELECT * FROM ${config.table} WHERE id = ?`,
      [id],
    );
    res.status(201).json(config.map(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi thêm bài tập" });
  }
});

// PUT /api/exercises/:type/:id
app.put("/api/exercises/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const config = exerciseRoutes[type];
    if (!config)
      return res.status(400).json({ error: "Loại bài tập không hợp lệ" });

    const db = getPool();
    const [info] = await db.query(
      `SELECT id FROM ${config.table} WHERE id = ?`,
      [id],
    );
    if (info.length === 0)
      return res.status(404).json({ error: "Bài tập không tồn tại" });

    const updates = config.fields.map((f) => `${f} = ?`).join(", ");
    const values = [
      ...config.fields.map((f) => (req.body[f] || "").trim()),
      id,
    ];
    await db.query(
      `UPDATE ${config.table} SET ${updates} WHERE id = ?`,
      values,
    );
    const [rows] = await db.query(
      `SELECT * FROM ${config.table} WHERE id = ?`,
      [id],
    );
    res.json(config.map(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi cập nhật bài tập" });
  }
});

// DELETE /api/exercises/:type/:id
app.delete("/api/exercises/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const config = exerciseRoutes[type];
    if (!config)
      return res.status(400).json({ error: "Loại bài tập không hợp lệ" });

    const db = getPool();
    await db.query(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi xóa bài tập" });
  }
});

// ─── Auth routes ────────────────────────────────────────────

// POST /api/auth — verify admin password
app.post("/api/auth", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Thiếu mật khẩu" });

    const db = getPool();
    const [rows] = await db.query(
      "SELECT password_hash FROM admin_settings WHERE id = 1",
    );
    if (rows.length === 0) {
      return res.status(500).json({ error: "Chưa cấu hình admin" });
    }

    const isValid = rows[0].password_hash === hashPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: "Mật khẩu không đúng" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi xác thực" });
  }
});

// PUT /api/auth/password — change admin password
app.put("/api/auth/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const db = getPool();
    const [rows] = await db.query(
      "SELECT password_hash FROM admin_settings WHERE id = 1",
    );
    if (rows[0].password_hash !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    await db.query(
      "UPDATE admin_settings SET password_hash = ? WHERE id = 1",
      [hashPassword(newPassword)],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi đổi mật khẩu" });
  }
});

// ─── Export for Vercel ──────────────────────────────────────

export default app;
