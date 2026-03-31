import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '79.127.235.187', port: 1026,
  user: 'u8172_GnVHgwY0fa',
  password: process.env.DB_PASSWORD,
  database: 's8172_hanzi',
  charset: 'utf8mb4',
});

const [levels] = await pool.query("SELECT id FROM levels WHERE name = 'Ôn Tập'");
const levelId = levels[0].id;

// These are compound words that were split incorrectly - they should be compound words
// Plus single-char words that have standalone meaning
const WORDS = [
  // Compound words (từ ghép bị tách thành ký tự đơn)
  ['朋友', 'péngyou', 'bạn bè', 'Danh từ'],
  ['电影', 'diànyǐng', 'phim, điện ảnh', 'Danh từ'],
  ['漂亮', 'piàoliang', 'đẹp, xinh', 'Tính từ'],
  ['苹果', 'píngguǒ', 'táo', 'Danh từ'],
  ['汉语', 'hànyǔ', 'tiếng Hán', 'Danh từ'],
  ['今天', 'jīntiān', 'hôm nay', 'Danh từ'],
  ['昨天', 'zuótiān', 'hôm qua', 'Danh từ'],
  ['星期', 'xīngqī', 'tuần', 'Danh từ'],
  ['孩子', 'háizi', 'con, đứa trẻ', 'Danh từ'],
  ['姑娘', 'gūniang', 'cô gái', 'Danh từ'],
  ['公司', 'gōngsī', 'công ty', 'Danh từ'],
  ['便宜', 'piányi', 'rẻ', 'Tính từ'],
  ['北方', 'běifāng', 'phương bắc', 'Danh từ'],
  ['食堂', 'shítáng', 'nhà ăn, canteen', 'Danh từ'],
  ['谦虚', 'qiānxū', 'khiêm tốn', 'Tính từ'],
  ['勇敢', 'yǒnggǎn', 'dũng cảm', 'Tính từ'],
  ['希望', 'xīwàng', 'hy vọng', 'Động từ'],
  ['有趣', 'yǒuqù', 'thú vị', 'Tính từ'],
  ['事情', 'shìqing', 'sự việc, chuyện', 'Danh từ'],
  ['发达', 'fādá', 'phát triển', 'Tính từ'],
  ['实在', 'shízài', 'thật sự, thực tế', 'Phó từ'],

  // Single-char words with standalone meaning
  ['买', 'mǎi', 'mua', 'Động từ'],
  ['去', 'qù', 'đi', 'Động từ'],
  ['看', 'kàn', 'xem, nhìn', 'Động từ'],
  ['多', 'duō', 'nhiều', 'Tính từ'],
  ['热', 'rè', 'nóng', 'Tính từ'],
  ['菜', 'cài', 'rau, món ăn', 'Danh từ'],
  ['贵', 'guì', 'đắt, quý', 'Tính từ'],
  ['还', 'hái', 'còn, vẫn', 'Phó từ'],
  ['懂', 'dǒng', 'hiểu', 'Động từ'],
  ['可', 'kě', 'có thể', 'Phó từ'],
  ['地', 'dì/de', 'đất / (trợ từ)', 'Danh từ'],
  ['辆', 'liàng', 'chiếc (lượng từ xe)', 'Lượng từ'],
  ['支', 'zhī', 'cây, cái (lượng từ bút)', 'Lượng từ'],
  ['本', 'běn', 'quyển (lượng từ sách)', 'Lượng từ'],
];

let count = 0;
for (const [chinese, pinyin, vietnamese, wordType] of WORDS) {
  // Check if already exists
  const [existing] = await pool.query(
    "SELECT id FROM translation_exercises WHERE chinese = ? AND level_id = ?",
    [chinese, levelId]
  );
  if (existing.length > 0) {
    console.log(`  ⏭️  ${chinese} (${vietnamese}) — đã có`);
    continue;
  }

  const id = `ontap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    "INSERT INTO translation_exercises (id, level_id, vietnamese, chinese, pinyin, word_type) VALUES (?, ?, ?, ?, ?, ?)",
    [id, levelId, vietnamese, chinese, pinyin, wordType]
  );
  console.log(`  ✅ ${chinese} (${vietnamese})`);
  count++;
  await new Promise(r => setTimeout(r, 15));
}

// Final count
const [total] = await pool.query(
  "SELECT COUNT(*) as cnt FROM translation_exercises WHERE level_id = ?", [levelId]
);
console.log(`\n✅ Đã thêm ${count} từ mới. Tổng từ vựng Ôn Tập: ${total[0].cnt}`);
await pool.end();
