import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: "79.127.235.187",
    port: 1026,
    user: "u8172_GnVHgwY0fa",
    password: process.env.DB_PASSWORD || "",
    database: "s8172_GnVHgwY0fa",
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
  });

  return pool;
}

// ─── Init tables ──────────────────────────────────────────

export async function initDatabase() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS levels (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS translation_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      vietnamese TEXT NOT NULL,
      chinese TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sentence_translation_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      vietnamese_sentence TEXT NOT NULL,
      chinese_sentence TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sentence_exercises (
      id VARCHAR(255) PRIMARY KEY,
      level_id VARCHAR(255) NOT NULL,
      correct_sentence TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      vietnamese_meaning TEXT NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed if empty
  const [rows] = await db.query("SELECT COUNT(*) AS c FROM levels");
  if (rows[0].c === 0) {
    await seedDefaultData(db);
    console.log("✅ Default data seeded");
  }
}

// ─── Seed ─────────────────────────────────────────────────

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
    await db.query("INSERT INTO levels (id, name, sort_order) VALUES (?, ?, ?)", row);
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
    await db.query("INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin) VALUES (?, ?, ?, ?, ?)", row);
  }

  const sentTrans = [
    ["st1", "hsk1", "Bạn khỏe không?", "你好吗？", "nǐ hǎo ma?"],
    ["st2", "hsk1", "Tôi rất khỏe", "我很好", "wǒ hěn hǎo"],
    ["st3", "hsk1", "Cảm ơn bạn", "谢谢你", "xiè xie nǐ"],
    ["st4", "hsk1", "Hẹn gặp lại", "再见！", "zài jiàn!"],
    ["st1_hsk2", "hsk2", "Bây giờ mấy giờ rồi?", "现在几点？", "xiàn zài jǐ diǎn?"],
    ["st2_hsk2", "hsk2", "Hôm nay thứ mấy?", "今天星期几？", "jīn tiān xīng qī jǐ?"],
  ];
  for (const row of sentTrans) {
    await db.query("INSERT INTO sentence_translation_exercises (id, level_id, vietnamese_sentence, chinese_sentence, pinyin) VALUES (?, ?, ?, ?, ?)", row);
  }

  const sent = [
    ["s1", "hsk1", "你好吗", "nǐ hǎo ma", "Bạn khỏe không?"],
    ["s2", "hsk1", "我很好", "wǒ hěn hǎo", "Tôi rất khỏe"],
    ["s3", "hsk1", "谢谢你", "xiè xie nǐ", "Cảm ơn bạn"],
  ];
  for (const row of sent) {
    await db.query("INSERT INTO sentence_exercises (id, level_id, correct_sentence, pinyin, vietnamese_meaning) VALUES (?, ?, ?, ?, ?)", row);
  }
}

// ─── Query helpers ────────────────────────────────────────

export async function getAllLevels() {
  const db = getPool();
  const [levels] = await db.query("SELECT * FROM levels ORDER BY sort_order");

  const result = [];
  for (const level of levels) {
    const [translationExercises] = await db.query(
      "SELECT id, vietnamese, chinese, pinyin FROM translation_exercises WHERE level_id = ?",
      [level.id]
    );
    const [sentenceTranslationExercises] = await db.query(
      "SELECT id, vietnamese_sentence AS vietnameseSentence, chinese_sentence AS chineseSentence, pinyin FROM sentence_translation_exercises WHERE level_id = ?",
      [level.id]
    );
    const [sentenceExercises] = await db.query(
      "SELECT id, correct_sentence AS correctSentence, pinyin, vietnamese_meaning AS vietnameseMeaning FROM sentence_exercises WHERE level_id = ?",
      [level.id]
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

export const EXERCISE_CONFIG = {
  translation: {
    table: "translation_exercises",
    fields: ["vietnamese", "chinese", "pinyin"],
    map: (r) => ({ id: r.id, vietnamese: r.vietnamese, chinese: r.chinese, pinyin: r.pinyin }),
  },
  sentenceTranslation: {
    table: "sentence_translation_exercises",
    fields: ["vietnamese_sentence", "chinese_sentence", "pinyin"],
    map: (r) => ({ id: r.id, vietnameseSentence: r.vietnamese_sentence, chineseSentence: r.chinese_sentence, pinyin: r.pinyin }),
  },
  sentence: {
    table: "sentence_exercises",
    fields: ["correct_sentence", "pinyin", "vietnamese_meaning"],
    map: (r) => ({ id: r.id, correctSentence: r.correct_sentence, pinyin: r.pinyin, vietnameseMeaning: r.vietnamese_meaning }),
  },
};
