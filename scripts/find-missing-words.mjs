import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '79.127.235.187', port: 1026,
  user: 'u8172_GnVHgwY0fa',
  password: process.env.DB_PASSWORD,
  database: 's8172_hanzi',
  charset: 'utf8mb4',
});

// Get Ôn Tập level id
const [levels] = await pool.query("SELECT id FROM levels WHERE name = 'Ôn Tập'");
const levelId = levels[0].id;

// Get existing translation words
const [translations] = await pool.query(
  "SELECT chinese FROM translation_exercises WHERE level_id = ?", [levelId]
);
const existing = new Set(translations.map(r => r.chinese));

// Get sentence translations
const [sentences] = await pool.query(
  "SELECT chinese_sentence FROM sentence_translation_exercises WHERE level_id = ?", [levelId]
);

// Known multi-char words (sorted by length desc for greedy matching)
const COMPOUNDS = [
  '好久不见','不客气','手机','水果','奶茶','咖啡',
  '越南','中国','美国','英国','韩国','日本',
  '经理','老师','学生','名字','什么','身体',
  '工作','高兴','喜欢','认识','最近','国家',
  '好用','好喝','你们','我们','他们','她们','它们','咱们',
  '大家','人们','问题','一样','一下','可以',
  '休息','吃饭',
].sort((a, b) => b.length - a.length);

function tokenize(sentence) {
  const tokens = new Set();
  let s = sentence.replace(/[，。！？、：；\s""''「」]/g, '');

  while (s.length > 0) {
    let found = false;
    for (const w of COMPOUNDS) {
      if (s.startsWith(w)) {
        tokens.add(w);
        s = s.slice(w.length);
        found = true;
        break;
      }
    }
    if (!found) {
      tokens.add(s[0]);
      s = s.slice(1);
    }
  }
  return tokens;
}

// Extract all unique words from sentences
const allWords = new Set();
for (const row of sentences) {
  const tokens = tokenize(row.chinese_sentence);
  for (const t of tokens) allWords.add(t);
}

// Find missing words (not in translation exercises)
const missing = [...allWords].filter(w => !existing.has(w)).sort();

console.log(`\n=== Từ trong câu nhưng CHƯA CÓ trong bài tập dịch từ (${missing.length} từ) ===\n`);

// Map known meanings
const MEANINGS = {
  '人': ['rén', 'người', 'Danh từ'],
  '个': ['gè', 'cái (lượng từ)', 'Lượng từ'],
  '对': ['duì', 'đúng, phải', 'Tính từ'],
  '有': ['yǒu', 'có', 'Động từ'],
  '和': ['hé', 'và, với', 'Liên từ'],
  '会': ['huì', 'biết, có thể', 'Động từ'],
  '用': ['yòng', 'dùng, sử dụng', 'Động từ'],
  '杯': ['bēi', 'cốc, ly (lượng từ)', 'Lượng từ'],
  '等': ['děng', 'đợi, chờ', 'Động từ'],
  '累': ['lèi', 'mệt, mỏi', 'Tính từ'],
  '爱': ['ài', 'yêu, thương', 'Động từ'],
  '大': ['dà', 'to, lớn', 'Tính từ'],
  '酒': ['jiǔ', 'rượu', 'Danh từ'],
  '饭': ['fàn', 'cơm', 'Danh từ'],
  '手机': ['shǒujī', 'điện thoại', 'Danh từ'],
  '奶茶': ['nǎichá', 'trà sữa', 'Danh từ'],
  '国家': ['guójiā', 'quốc gia, đất nước', 'Danh từ'],
  '问题': ['wèntí', 'vấn đề, câu hỏi', 'Danh từ'],
  '可以': ['kěyǐ', 'có thể, được', 'Động từ'],
  '一样': ['yíyàng', 'giống nhau, như nhau', 'Tính từ'],
  '一下': ['yíxià', 'một chút, một lát', 'Phó từ'],
  '休息': ['xiūxi', 'nghỉ ngơi', 'Động từ'],
  '好用': ['hǎoyòng', 'dễ dùng, tiện dụng', 'Tính từ'],
  '好喝': ['hǎohē', 'ngon (đồ uống)', 'Tính từ'],
  '吃饭': ['chīfàn', 'ăn cơm', 'Động từ'],
  '书': ['shū', 'sách', 'Danh từ'],
  '车': ['chē', 'xe', 'Danh từ'],
  '笔': ['bǐ', 'bút', 'Danh từ'],
};

for (const w of missing) {
  const info = MEANINGS[w];
  if (info) {
    console.log(`  ${w} → ${info[0]} | ${info[1]} | ${info[2]}`);
  } else {
    console.log(`  ${w} → (chưa có nghĩa)`);
  }
}

// Insert missing words that have known meanings
console.log('\n--- Thêm từ mới vào DB ---\n');
let count = 0;
for (const w of missing) {
  const info = MEANINGS[w];
  if (!info) continue;

  const id = `ontap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin, word_type) VALUES (?, ?, ?, ?, ?, ?)",
    [id, levelId, info[1], w, info[0], info[2]]
  );
  console.log(`  ✅ ${w} (${info[1]})`);
  count++;
  // small delay to ensure unique IDs
  await new Promise(r => setTimeout(r, 10));
}

console.log(`\n✅ Đã thêm ${count} từ mới. Tổng từ vựng: ${existing.size + count}`);

// List remaining unknown
const unknown = missing.filter(w => !MEANINGS[w]);
if (unknown.length > 0) {
  console.log(`\n⚠️  Còn ${unknown.length} từ chưa có nghĩa (cần thêm thủ công):`);
  unknown.forEach(w => console.log(`  ${w}`));
}

await pool.end();
