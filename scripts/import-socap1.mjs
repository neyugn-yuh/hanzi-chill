import mysql from "mysql2/promise";
import { CHAPTERS } from "./socap1-data.mjs";

const pool = mysql.createPool({
  host: "79.127.235.187",
  port: 1026,
  user: "u8172_GnVHgwY0fa",
  password: process.env.DB_PASSWORD,
  database: "s8172_hanzi",
  charset: "utf8mb4",
  connectTimeout: 15000,
});

// Deterministic ID prefix so re-running is idempotent (no duplicates)
const PREFIX = "sc1";

async function getMaxSortOrder(conn) {
  const [[r]] = await conn.query("SELECT MAX(sort_order) AS m FROM levels");
  return r.m ?? -1;
}

async function run() {
  const conn = await pool.getConnection();
  let added = { levels: 0, trans: 0, sentTrans: 0, sent: 0 };
  let skipped = { levels: 0, trans: 0, sentTrans: 0, sent: 0 };
  try {
    let sortOrder = await getMaxSortOrder(conn);

    for (let ci = 0; ci < CHAPTERS.length; ci++) {
      const ch = CHAPTERS[ci];
      const levelId = `${PREFIX}_bai${ci + 1}`;

      const [existingLevel] = await conn.query(
        "SELECT id FROM levels WHERE id = ?",
        [levelId],
      );
      if (existingLevel.length === 0) {
        sortOrder += 1;
        await conn.query(
          "INSERT INTO levels (id, name, sort_order) VALUES (?, ?, ?)",
          [levelId, ch.name, sortOrder],
        );
        added.levels++;
        console.log(`+ level ${levelId} "${ch.name}" (sort ${sortOrder})`);
      } else {
        skipped.levels++;
        console.log(`= level ${levelId} "${ch.name}" already exists`);
      }

      // ─── translation (vocab) ──────────────────────────
      for (let i = 0; i < (ch.translation || []).length; i++) {
        const e = ch.translation[i];
        const id = `${levelId}_t${i + 1}`;
        const [ex] = await conn.query(
          "SELECT id FROM translation_exercises WHERE id = ?",
          [id],
        );
        if (ex.length) { skipped.trans++; continue; }
        await conn.query(
          "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin, word_type) VALUES (?, ?, ?, ?, ?, ?)",
          [id, levelId, e.vietnamese, e.chinese, e.pinyin, e.wordType || ""],
        );
        added.trans++;
      }

      // ─── sentenceTranslation (Vi -> Zh) ───────────────
      for (let i = 0; i < (ch.sentenceTranslation || []).length; i++) {
        const e = ch.sentenceTranslation[i];
        const id = `${levelId}_st${i + 1}`;
        const [ex] = await conn.query(
          "SELECT id FROM sentence_translation_exercises WHERE id = ?",
          [id],
        );
        if (ex.length) { skipped.sentTrans++; continue; }
        await conn.query(
          "INSERT INTO sentence_translation_exercises (id, level_id, vietnamese_sentence, chinese_sentence, pinyin) VALUES (?, ?, ?, ?, ?)",
          [id, levelId, e.vietnameseSentence, e.chineseSentence, e.pinyin],
        );
        added.sentTrans++;
      }

      // ─── sentence (arrange chars) ─────────────────────
      for (let i = 0; i < (ch.sentence || []).length; i++) {
        const e = ch.sentence[i];
        const id = `${levelId}_s${i + 1}`;
        const [ex] = await conn.query(
          "SELECT id FROM sentence_exercises WHERE id = ?",
          [id],
        );
        if (ex.length) { skipped.sent++; continue; }
        await conn.query(
          "INSERT INTO sentence_exercises (id, level_id, correct_sentence, pinyin, vietnamese_meaning) VALUES (?, ?, ?, ?, ?)",
          [id, levelId, e.correctSentence, e.pinyin, e.vietnameseMeaning],
        );
        added.sent++;
      }
    }

    console.log("\n=== DONE ===");
    console.log("Added  :", added);
    console.log("Skipped:", skipped);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
