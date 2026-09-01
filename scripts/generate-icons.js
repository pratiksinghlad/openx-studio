import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Standard CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf, offset, length) {
  let crc = 0xffffffff;
  for (let i = 0; i < length; i++) {
    crc = crcTable[(crc ^ buf[offset + i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writePngChunk(type, data) {
  const len = data ? data.length : 0;
  const buf = Buffer.alloc(len + 12);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  if (data) data.copy(buf, 8);
  const crc = crc32(buf, 4, len + 4);
  buf.writeUInt32BE(crc, len + 8);
  return buf;
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // Filter: None
    rgbaBuffer.copy(
      scanlines,
      y * (1 + width * 4) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = writePngChunk('IHDR', ihdr);
  const idatChunk = writePngChunk('IDAT', zlib.deflateSync(scanlines, { level: 9 }));
  const iendChunk = writePngChunk('IEND', null);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderIconPixels(size, isMaskable = false) {
  const buffer = Buffer.alloc(size * size * 4);
  const radius = isMaskable ? 0 : size * 0.22;
  const padding = isMaskable ? 0 : size * 0.04;
  const rectX0 = padding;
  const rectY0 = padding;
  const rectX1 = size - padding;
  const rectY1 = size - padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      let inside = false;
      if (isMaskable) {
        inside = true;
      } else {
        const cx = Math.max(rectX0 + radius, Math.min(x, rectX1 - radius));
        const cy = Math.max(rectY0 + radius, Math.min(y, rectY1 - radius));
        const distSq = (x - cx) ** 2 + (y - cy) ** 2;
        inside = distSq <= radius ** 2;
      }

      if (inside) {
        const t = (x / size + y / size) / 2;
        const r = Math.round(59 + (29 - 59) * t);
        const g = Math.round(130 + (78 - 130) * t);
        const b = Math.round(246 + (216 - 246) * t);

        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
        buffer[idx + 3] = 255;
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  drawCarIcon(buffer, size);
  return buffer;
}

function drawLine(buf, size, x0, y0, x1, y1, strokeWidth, r = 255, g = 255, b = 255, a = 255) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
  const hw = strokeWidth / 2;

  for (let s = 0; s <= steps; s++) {
    const px = x0 + (dx * s) / steps;
    const py = y0 + (dy * s) / steps;
    for (let oy = -hw; oy <= hw; oy++) {
      for (let ox = -hw; ox <= hw; ox++) {
        if (ox * ox + oy * oy <= hw * hw) {
          const ix = Math.round(px + ox);
          const iy = Math.round(py + oy);
          if (ix >= 0 && ix < size && iy >= 0 && iy < size) {
            const idx = (iy * size + ix) * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }
    }
  }
}

function drawCircleOutline(buf, size, cx, cy, radius, strokeWidth) {
  const hw = strokeWidth / 2;
  const rMin = radius - hw;
  const rMax = radius + hw;
  const minX = Math.max(0, Math.floor(cx - rMax));
  const maxX = Math.min(size - 1, Math.ceil(cx + rMax));
  const minY = Math.max(0, Math.floor(cy - rMax));
  const maxY = Math.min(size - 1, Math.ceil(cy + rMax));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d >= rMin && d <= rMax) {
        const idx = (y * size + x) * 4;
        buf[idx] = 255;
        buf[idx + 1] = 255;
        buf[idx + 2] = 255;
        buf[idx + 3] = 255;
      }
    }
  }
}

function drawCarIcon(buffer, size) {
  const scale = size / 64;
  const strokeW = Math.max(2, Math.round(3 * scale));
  const tx = 14 * scale;
  const ty = 14 * scale;
  const s = 1.5 * scale;

  const toPx = (gx, gy) => [tx + gx * s, ty + gy * s];

  const p1 = toPx(2, 14);
  const p2 = toPx(2, 12);
  const p3 = toPx(3.4, 9.1);
  const p4 = toPx(5, 8.5);
  const p5 = toPx(13, 8.5);
  const p6 = toPx(15.2, 10.8);
  const p7 = toPx(18.5, 11.1);
  const p8 = toPx(21, 12);
  const p9 = toPx(21, 16);
  const p10 = toPx(19, 16);

  drawLine(buffer, size, p1[0], p1[1], p2[0], p2[1], strokeW);
  drawLine(buffer, size, p2[0], p2[1], p3[0], p3[1], strokeW);
  drawLine(buffer, size, p3[0], p3[1], p4[0], p4[1], strokeW);
  drawLine(buffer, size, p4[0], p4[1], p5[0], p5[1], strokeW);
  drawLine(buffer, size, p5[0], p5[1], p6[0], p6[1], strokeW);
  drawLine(buffer, size, p6[0], p6[1], p7[0], p7[1], strokeW);
  drawLine(buffer, size, p7[0], p7[1], p8[0], p8[1], strokeW);
  drawLine(buffer, size, p8[0], p8[1], p9[0], p9[1], strokeW);
  drawLine(buffer, size, p9[0], p9[1], p10[0], p10[1], strokeW);

  const pb1 = toPx(9, 16.5);
  const pb2 = toPx(15, 16.5);
  drawLine(buffer, size, pb1[0], pb1[1], pb2[0], pb2[1], strokeW);

  const w1 = toPx(7, 16.5);
  const w2 = toPx(17, 16.5);
  const wheelRadius = 2.4 * s;
  drawCircleOutline(buffer, size, w1[0], w1[1], wheelRadius, strokeW);
  drawCircleOutline(buffer, size, w2[0], w2[1], wheelRadius, strokeW);
}

function generateIcons() {
  const targets = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const t of targets) {
    const pixels = renderIconPixels(t.size, t.maskable);
    const pngBuf = encodeRGBAtoPNG(t.size, t.size, pixels);
    const outPath = path.join(publicDir, t.name);
    fs.writeFileSync(outPath, pngBuf);
    console.log(`Generated ${t.name} (${t.size}x${t.size}) -> ${outPath}`);
  }
}

generateIcons();
