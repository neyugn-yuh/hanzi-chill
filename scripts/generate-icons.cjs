// scripts/generate-icons.cjs
// Generates PNG icons without any external dependencies
// Uses only Node.js Buffer + basic PNG encoding

const { writeFileSync, mkdirSync } = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function createPNG(width, height) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // length
  ihdr.write("IHDR", 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;  // bit depth
  ihdr[17] = 2;  // color type (RGB)
  ihdr[18] = 0;  // compression
  ihdr[19] = 0;  // filter
  ihdr[20] = 0;  // interlace

  // CRC for IHDR
  const ihdrData = ihdr.slice(4, 21);
  ihdr.writeUInt32BE(crc32(ihdrData), 21);

  // IDAT chunk — create gradient red image
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Gradient from red (#ef4444) to dark red (#dc2626)
      const t = (x + y) / (width + height);
      const r = Math.round(239 - t * 31);
      const g = Math.round(68 - t * 30);
      const b = Math.round(68 - t * 18);
      rawData.push(r, g, b);
    }
  }

  const zlib = require("zlib");
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const idatLenBuf = Buffer.alloc(4);
  idatLenBuf.writeUInt32BE(compressed.length, 0);
  const idatType = Buffer.from("IDAT");
  const idatData = Buffer.concat([idatType, compressed]);
  const idatCrcBuf = Buffer.alloc(4);
  idatCrcBuf.writeUInt32BE(crc32(idatData), 0);
  const idat = Buffer.concat([idatLenBuf, idatData, idatCrcBuf]);

  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// CRC32 lookup table
const crcTable = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

writeFileSync(path.join(outDir, "icon-192.png"), createPNG(192, 192));
writeFileSync(path.join(outDir, "icon-512.png"), createPNG(512, 512));
console.log("✅ Icons generated: public/icons/icon-192.png, icon-512.png");
