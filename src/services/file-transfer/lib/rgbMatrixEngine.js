/**
 * AirPulse RGB Color Grid Matrix Engine
 * High-Density RGB Color Grid Encoding with Balanced Square Layout,
 * Corner Reticle Alignment & Sequence Headers.
 */

export const RGB_PALETTE = [
  { id: 0, bit: '00', name: 'RED', hex: '#ef4444', rgb: [239, 68, 68] },
  { id: 1, bit: '01', name: 'GREEN', hex: '#22c55e', rgb: [34, 197, 94] },
  { id: 2, bit: '10', name: 'BLUE', hex: '#3b82f6', rgb: [59, 130, 246] },
  { id: 3, bit: '11', name: 'WHITE', hex: '#ffffff', rgb: [255, 255, 255] },
];

const BG_COLOR = '#0f172a';

/**
 * Render Symmetrical Square RGB Color Grid Frame onto HTML5 Canvas
 */
export function renderRGBMatrixFrame(canvas, frameHeader, payloadBytes) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Serialize Frame Header: [FileID(2B), FrameSeq(2B), TotalFrames(2B), PayloadLen(2B)]
  const headerBytes = new Uint8Array(8);
  const view = new DataView(headerBytes.buffer);
  view.setUint16(0, frameHeader.fileId & 0xFFFF, false);
  view.setUint16(2, frameHeader.frameSeq & 0xFFFF, false);
  view.setUint16(4, frameHeader.totalFrames & 0xFFFF, false);
  view.setUint16(6, payloadBytes.length & 0xFFFF, false);

  // Combine Header + Payload
  const fullFrameBytes = new Uint8Array(headerBytes.length + payloadBytes.length);
  fullFrameBytes.set(headerBytes, 0);
  fullFrameBytes.set(payloadBytes, headerBytes.length);

  // Convert bytes to 2-bit dibits
  const dibits = [];
  for (let i = 0; i < fullFrameBytes.length; i++) {
    const b = fullFrameBytes[i];
    dibits.push((b >> 6) & 0x03);
    dibits.push((b >> 4) & 0x03);
    dibits.push((b >> 2) & 0x03);
    dibits.push(b & 0x03);
  }

  // Calculate balanced square grid dimensions N x N
  const gridDimension = Math.max(10, Math.ceil(Math.sqrt(dibits.length)));
  const totalCells = gridDimension * gridDimension;

  // Pad remaining cells with default 0 dibit
  while (dibits.length < totalCells) {
    dibits.push(0);
  }

  const margin = 32;
  const availSize = size - margin * 2;
  const cellSize = availSize / gridDimension;

  // Draw 4 Bold Corner Finder Reticle Targets
  const r = Math.max(12, cellSize * 1.4);
  const drawCornerReticle = (cx, cy) => {
    ctx.fillStyle = '#ef4444'; // Red outer
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#0f172a'; // Dark inner
    ctx.fillRect(cx - r + 3, cy - r + 3, r * 2 - 6, r * 2 - 6);
    ctx.fillStyle = '#3b82f6'; // Blue center
    ctx.fillRect(cx - r + 6, cy - r + 6, r * 2 - 12, r * 2 - 12);
  };

  const cPos = margin / 2;
  drawCornerReticle(cPos, cPos);
  drawCornerReticle(size - cPos, cPos);
  drawCornerReticle(cPos, size - cPos);
  drawCornerReticle(size - cPos, size - cPos);

  // Draw Symmetrical RGB Color Grid
  for (let i = 0; i < dibits.length; i++) {
    const col = i % gridDimension;
    const row = Math.floor(i / gridDimension);

    const x = margin + col * cellSize;
    const y = margin + row * cellSize;

    const color = RGB_PALETTE[dibits[i]] || RGB_PALETTE[0];
    ctx.fillStyle = color.hex;
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
  }
}

/**
 * Classifies an RGB pixel sample [R, G, B] to nearest RGB_PALETTE dibit (0..3)
 */
export function classifyRGBPixel(r, g, b) {
  let minDistance = Infinity;
  let bestId = 0;

  for (const color of RGB_PALETTE) {
    const [pr, pg, pb] = color.rgb;
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      bestId = color.id;
    }
  }

  return bestId;
}

/**
 * Parses RGB Color Grid Canvas Frame
 */
export function decodeRGBMatrixCanvas(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  // We read the grid based on sampling centers
  const gridDimension = 16;
  const margin = 32;
  const availSize = size - margin * 2;
  const cellSize = availSize / gridDimension;

  const dibits = [];
  const totalCells = gridDimension * gridDimension;

  for (let i = 0; i < totalCells; i++) {
    const col = i % gridDimension;
    const row = Math.floor(i / gridDimension);

    const cx = Math.floor(margin + col * cellSize + cellSize / 2);
    const cy = Math.floor(margin + row * cellSize + cellSize / 2);

    const pixelIdx = (cy * size + cx) * 4;
    const r = data[pixelIdx];
    const g = data[pixelIdx + 1];
    const b = data[pixelIdx + 2];

    dibits.push(classifyRGBPixel(r, g, b));
  }

  const totalBytes = Math.floor(dibits.length / 4);
  const frameBytes = new Uint8Array(totalBytes);
  for (let i = 0; i < totalBytes; i++) {
    const d0 = dibits[i * 4];
    const d1 = dibits[i * 4 + 1];
    const d2 = dibits[i * 4 + 2];
    const d3 = dibits[i * 4 + 3];
    frameBytes[i] = (d0 << 6) | (d1 << 4) | (d2 << 2) | d3;
  }

  if (frameBytes.length < 8) return null;

  const view = new DataView(frameBytes.buffer);
  const fileId = view.getUint16(0, false);
  const frameSeq = view.getUint16(2, false);
  const totalFrames = view.getUint16(4, false);
  const payloadLen = view.getUint16(6, false);

  const payloadBytes = frameBytes.subarray(8, Math.min(8 + payloadLen, frameBytes.length));

  return {
    fileId,
    frameSeq,
    totalFrames,
    payloadBytes,
  };
}
