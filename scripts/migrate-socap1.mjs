import mysql from "mysql2/promise";
import { LESSONS } from "./socap1-lessons.mjs";

const pool = mysql.createPool({
  host: "79.127.235.187",
  port: 1026,
  user: "u8172_GnVHgwY0fa",
  password: process.env.DB_PASSWORD,
  database: "s8172_hanzi",
  charset: "utf8mb4",
  connectTimeout: 15000,
});

// 3 root groups requested by user
const GROUPS = [
  { id: "socap1", name: "Sơ Cấp 1", sort_order: 0 },
  { id: "socap2", name: "Sơ Cấp 2", sort_order: 1 },
  { id: "ontap_socap1", name: "Ôn Tập Sơ Cấp 1", sort_order: 2 },
];

// Old levels to DELETE entirely (user confirmed)
const DELETE_LEVEL_IDS = [
  "hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6",
  "level_1774939033567_t9ezrm", // "Ôn Tập" (484 từ)
  "level_bai5_1775554698295",   // "Bài 5"
  "level_1775555138418_wp3of8", // "Cấp độ 1"
];

// New Sơ Cấp 1 lesson levels use prefix sc1l_ (distinct from existing sc1_bai*)
const NEW_PREFIX = "sc1l";

async function ensureSchema(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS level_groups (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // add group_id column to levels if missing
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'levels' AND COLUMN_NAME = 'group_id'`,
  );
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE levels ADD COLUMN group_id VARCHAR(255) NULL`);
    console.log("+ added levels.group_id column");
  } else {
    console.log("= levels.group_id already exists");
  }
}

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await ensureSchema(conn);

    // 1) seed groups (idempotent)
    for (const g of GROUPS) {
      await conn.query(
        `INSERT INTO level_groups (id, name, sort_order) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
        [g.id, g.name, g.sort_order],
      );
    }
    console.log(`= seeded ${GROUPS.length} groups`);

    // 2) delete old data (FK ON DELETE CASCADE removes child exercises)
    let deleted = 0;
    for (const id of DELETE_LEVEL_IDS) {
      const [r] = await conn.query("DELETE FROM levels WHERE id = ?", [id]);
      if (r.affectedRows) { deleted += r.affectedRows; console.log(`- deleted level ${id}`); }
    }
    console.log(`= deleted ${deleted} old levels`);

    // 3) assign previously-imported sc1_bai* (ôn tập) to ontap_socap1 group
    const [assignRes] = await conn.query(
      "UPDATE levels SET group_id = 'ontap_socap1' WHERE id LIKE 'sc1\\_bai%'",
    );
    console.log(`= assigned ${assignRes.affectedRows} ôn-tập levels to group ontap_socap1`);

    // 4) import 10 Sơ Cấp 1 lessons into socap1 group (idempotent)
    const added = { levels: 0, trans: 0, sentTrans: 0, sent: 0 };
    const skipped = { levels: 0, trans: 0, sentTrans: 0, sent: 0 };

    for (let li = 0; li < LESSONS.length; li++) {
      const lesson = LESSONS[li];
      const levelId = `${NEW_PREFIX}_bai${li + 1}`;

      const [existing] = await conn.query("SELECT id FROM levels WHERE id = ?", [levelId]);
      if (existing.length === 0) {
        await conn.query(
          "INSERT INTO levels (id, name, sort_order, group_id) VALUES (?, ?, ?, 'socap1')",
          [levelId, lesson.name, li],
        );
        added.levels++;
        console.log(`+ level ${levelId} "${lesson.name}"`);
      } else {
        await conn.query(
          "UPDATE levels SET group_id = 'socap1', sort_order = ? WHERE id = ?",
          [li, levelId],
        );
        skipped.levels++;
      }

      for (let i = 0; i < lesson.translation.length; i++) {
        const e = lesson.translation[i];
        const id = `${levelId}_t${i + 1}`;
        const [ex] = await conn.query("SELECT id FROM translation_exercises WHERE id = ?", [id]);
        if (ex.length) { skipped.trans++; continue; }
        await conn.query(
          "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin, word_type) VALUES (?, ?, ?, ?, ?, ?)",
          [id, levelId, e.vietnamese, e.chinese, e.pinyin, e.wordType || ""],
        );
        added.trans++;
      }

      for (let i = 0; i < lesson.sentenceTranslation.length; i++) {
        const e = lesson.sentenceTranslation[i];
        const id = `${levelId}_st${i + 1}`;
        const [ex] = await conn.query("SELECT id FROM sentence_translation_exercises WHERE id = ?", [id]);
        if (ex.length) { skipped.sentTrans++; continue; }
        await conn.query(
          "INSERT INTO sentence_translation_exercises (id, level_id, vietnamese_sentence, chinese_sentence, pinyin) VALUES (?, ?, ?, ?, ?)",
          [id, levelId, e.vietnameseSentence, e.chineseSentence, e.pinyin],
        );
        added.sentTrans++;
      }

      for (let i = 0; i < lesson.sentence.length; i++) {
        const e = lesson.sentence[i];
        const id = `${levelId}_s${i + 1}`;
        const [ex] = await conn.query("SELECT id FROM sentence_exercises WHERE id = ?", [id]);
        if (ex.length) { skipped.sent++; continue; }
        await conn.query(
          "INSERT INTO sentence_exercises (id, level_id, correct_sentence, pinyin, vietnamese_meaning) VALUES (?, ?, ?, ?, ?)",
          [id, levelId, e.correctSentence, e.pinyin, e.vietnameseMeaning],
        );
        added.sent++;
      }
    }

    await conn.commit();
    console.log("\n=== DONE (committed) ===");
    console.log("Added  :", added);
    console.log("Skipped:", skipped);
  } catch (err) {
    await conn.rollback();
    console.error("ERROR (rolled back):", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
