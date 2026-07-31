/**
 * AirPulse Prism 4-Color Palette Engine
 * Soft pastel 2-bit tile matrix rendering for zero-eye-strain optical fallback.
 */

export const PRISM_PALETTE = [
  { id: 0, bit: '00', hex: '#38bdf8', rgb: [56, 189, 248] },  // Soft Cyan
  { id: 1, bit: '01', hex: '#34d399', rgb: [52, 211, 153] },  // Soft Emerald
  { id: 2, bit: '10', hex: '#a78bfa', rgb: [167, 139, 250] }, // Soft Violet
  { id: 3, bit: '11', hex: '#fbbf24', rgb: [251, 191, 36] },  // Soft Amber
];

const BG_COLOR = '#0f172a'; // Dark Slate Navy

/**
 * Render Prism 4-Color Matrix onto HTML5 Canvas
 */
export function renderPrismCanvas(canvas, payloadString, gridCols = 12) {
  if (!canvas || !payloadString) return;

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Convert payload string to binary bit string
  let bitStr = '';
  for (let i = 0; i < payloadString.length; i++) {
    const code = payloadString.charCodeAt(i);
    bitStr += code.toString(2).padStart(8, '0');
  }

  // Group into 2-bit dibits
  const dibits = [];
  for (let i = 0; i < bitStr.length; i += 2) {
    const dibitStr = bitStr.slice(i, i + 2).padEnd(2, '0');
    dibits.push(parseInt(dibitStr, 2));
  }

  const rows = Math.ceil(dibits.length / gridCols);
  const padding = 24;
  const availableSize = size - padding * 2;
  const tileSize = availableSize / Math.max(gridCols, rows);

  // Draw 4 corner reticle targets for camera alignment
  const drawCorner = (x, y) => {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y, tileSize * 1.5, tileSize * 1.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 4, y + 4, tileSize * 1.5 - 8, tileSize * 1.5 - 8);
    ctx.fillStyle = '#a78bfa';
    ctx.fillRect(x + 8, y + 8, tileSize * 1.5 - 16, tileSize * 1.5 - 16);
  };

  drawCorner(8, 8);
  drawCorner(size - tileSize * 1.5 - 8, 8);
  drawCorner(8, size - tileSize * 1.5 - 8);
  drawCorner(size - tileSize * 1.5 - 8, size - tileSize * 1.5 - 8);

  // Draw soft pastel tiles
  for (let i = 0; i < dibits.length; i++) {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);

    const x = padding + col * tileSize;
    const y = padding + row * tileSize;

    const color = PRISM_PALETTE[dibits[i]] || PRISM_PALETTE[0];
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, tileSize - 2, tileSize - 2, 4);
    ctx.fill();
  }
}
