/**
 * AirPulse Fountain Code Engine
 * Advanced Luby Transform (LT) encoder with GF(2) Gaussian Elimination matrix solver.
 * Features Pre-Compression Stream + Optical QR Density Tuning.
 */

export function calculateCRC32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

function createPRNG(seed) {
  let s = (seed % 2147483647);
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getPermutatedIndex(K, passIndex, pos) {
  const rng = createPRNG(passIndex * 7919 + 104729);
  const perm = Array.from({ length: K }, (_, i) => i);
  for (let i = K - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = perm[i];
    perm[i] = perm[j];
    perm[j] = temp;
  }
  return perm[pos % K];
}

export function getDropletDegreeAndIndices(K, seed) {
  if (K <= 0) return { degree: 0, indices: [] };
  if (K === 1) return { degree: 1, indices: [0] };

  if (seed % 2 === 1) {
    const totalOddCount = Math.floor((seed - 1) / 2);
    const passIndex = Math.floor(totalOddCount / K);
    const pos = totalOddCount % K;
    const sysIdx = getPermutatedIndex(K, passIndex + 1, pos);
    return { degree: 1, indices: [sysIdx] };
  }

  const rng = createPRNG(seed);
  const p = rng();
  let degree = 2;
  
  if (p < 0.25) {
    degree = 1;
  } else if (p < 0.70) {
    degree = 2;
  } else if (p < 0.90) {
    degree = Math.min(3 + Math.floor(rng() * 3), K);
  } else {
    degree = Math.min(Math.floor(rng() * K) + 1, K);
  }

  const selected = new Set();
  while (selected.size < degree) {
    const idx = Math.floor(rng() * K);
    selected.add(idx);
  }
  return { degree: selected.size, indices: Array.from(selected) };
}

/**
 * Calculates optical camera-friendly block size to prevent QR grid over-density.
 * Maximum block size is capped at 180-260 bytes so camera sensors can resolve QR modules easily.
 */
export function calculateOpticalBlockSize(fileSizeBytes, requestedPreset = 'balanced') {
  switch (requestedPreset) {
    case 'reliable': return 130;
    case 'turbo': return 260;
    case 'balanced':
    default: return 180;
  }
}

/**
 * Asynchronous Compression Helper using browser native CompressionStream
 */
export async function compressPayloadIfBeneficial(rawBytes) {
  if (typeof CompressionStream === 'undefined') {
    return { data: rawBytes, isCompressed: false };
  }
  try {
    const stream = new Blob([rawBytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const compressedBytes = new Uint8Array(compressedBuffer);

    // Only use compressed if it actually reduced the size
    if (compressedBytes.length < rawBytes.length * 0.92) {
      return { data: compressedBytes, isCompressed: true };
    }
  } catch {
    // Compression fallback
  }
  return { data: rawBytes, isCompressed: false };
}

/**
 * Asynchronous Decompression Helper using browser native DecompressionStream
 */
export async function decompressPayload(compressedBytes) {
  if (typeof DecompressionStream === 'undefined') return compressedBytes;
  try {
    const stream = new Blob([compressedBytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const decompressedBuffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(decompressedBuffer);
  } catch {
    return compressedBytes;
  }
}

/**
 * LTEncoder — Converts file Uint8Array into infinite droplet stream
 */
export class LTEncoder {
  constructor(fileBytes, fileName, fileType = 'application/octet-stream', requestedPreset = 'balanced', isCompressed = false) {
    this.fileBytes = new Uint8Array(fileBytes);
    this.fileName = fileName || 'unnamed_file';
    this.fileType = fileType || 'application/octet-stream';
    this.fileSize = this.fileBytes.length;
    this.crc32 = calculateCRC32(this.fileBytes);
    this.fileId = (Math.floor(Math.random() * 0xFFFF)).toString(16).padStart(4, '0');
    this.isCompressed = isCompressed;
    
    // Optical-friendly block size
    this.blockSize = calculateOpticalBlockSize(this.fileSize, requestedPreset);
    this.K = Math.ceil(this.fileSize / this.blockSize);
    this.seedCounter = 1;

    this.blocks = [];
    for (let i = 0; i < this.K; i++) {
      const start = i * this.blockSize;
      const end = Math.min(start + this.blockSize, this.fileSize);
      const block = new Uint8Array(this.blockSize);
      block.set(this.fileBytes.subarray(start, end), 0);
      this.blocks.push(block);
    }
  }

  nextDroplet() {
    const seed = this.seedCounter++;
    const { indices } = getDropletDegreeAndIndices(this.K, seed);

    const xorPayload = new Uint8Array(this.blockSize);
    for (const idx of indices) {
      const sourceBlock = this.blocks[idx];
      for (let b = 0; b < this.blockSize; b++) {
        xorPayload[b] ^= sourceBlock[b];
      }
    }

    let binaryStr = '';
    const len = xorPayload.byteLength;
    for (let i = 0; i < len; i++) {
      binaryStr += String.fromCharCode(xorPayload[i]);
    }
    const payloadBase64 = btoa(binaryStr);

    const packet = {
      i: this.fileId,
      n: this.fileName,
      t: this.fileType,
      z: this.fileSize,
      k: this.K,
      b: this.blockSize,
      c: this.crc32,
      s: seed,
      gz: this.isCompressed ? 1 : 0,
      p: payloadBase64,
    };

    return JSON.stringify(packet);
  }
}

/**
 * LTDecoder — GF(2) Row Echelon Matrix Solver with Back Substitution
 */
export class LTDecoder {
  constructor() {
    this.reset();
  }

  reset() {
    this.fileId = null;
    this.fileName = '';
    this.fileType = '';
    this.fileSize = 0;
    this.blockSize = 0;
    this.K = 0;
    this.expectedCRC = '';
    this.isCompressed = false;
    this.receivedSeeds = new Set();
    this.pivotTable = [];
    this.rank = 0;

    this.isComplete = false;
    this.totalDropletsReceived = 0;
    this.usefulDropletsReceived = 0;
    this.assembledFile = null;
  }

  processPacket(rawPacketString) {
    if (this.isComplete) return { complete: true, progress: 1.0 };

    let packet;
    try {
      packet = typeof rawPacketString === 'object' ? rawPacketString : JSON.parse(rawPacketString);
    } catch {
      return { invalid: true };
    }

    if (!packet || !packet.k || !packet.s || !packet.p || !packet.c) {
      return { invalid: true };
    }

    this.totalDropletsReceived++;

    if (!this.fileId || this.fileId !== packet.i) {
      this.fileId = packet.i;
      this.fileName = packet.n || 'downloaded_file';
      this.fileType = packet.t || 'application/octet-stream';
      this.fileSize = packet.z;
      this.blockSize = packet.b;
      this.K = packet.k;
      this.expectedCRC = packet.c;
      this.isCompressed = packet.gz === 1;
      this.receivedSeeds.clear();
      this.pivotTable = new Array(this.K).fill(null);
      this.rank = 0;
      this.isComplete = false;
    }

    if (this.receivedSeeds.has(packet.s)) {
      return { duplicate: true, progress: this.rank / this.K };
    }
    this.receivedSeeds.add(packet.s);

    let payload;
    try {
      const binaryStr = atob(packet.p);
      payload = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        payload[i] = binaryStr.charCodeAt(i);
      }
    } catch {
      return { invalid: true };
    }

    const { indices } = getDropletDegreeAndIndices(this.K, packet.s);
    let rowMask = new Set(indices);
    let rowPayload = new Uint8Array(payload);

    for (let i = 0; i < this.K; i++) {
      if (rowMask.has(i)) {
        if (this.pivotTable[i] !== null) {
          const pivotRow = this.pivotTable[i];
          rowMask = xorSets(rowMask, pivotRow.mask);
          for (let b = 0; b < this.blockSize; b++) {
            rowPayload[b] ^= pivotRow.payload[b];
          }
        } else {
          this.pivotTable[i] = { mask: rowMask, payload: rowPayload };
          this.rank++;
          this.usefulDropletsReceived++;
          break;
        }
      }
    }

    if (this.rank === this.K && !this.isComplete) {
      this.finalizeFile();
    }

    return {
      complete: this.isComplete,
      progress: this.rank / this.K,
      solvedBlocks: this.rank,
      totalBlocks: this.K,
      assembledFile: this.assembledFile,
    };
  }

  async finalizeFile() {
    for (let i = this.K - 1; i >= 0; i--) {
      const currentPivot = this.pivotTable[i];
      if (!currentPivot) continue;

      for (let j = i - 1; j >= 0; j--) {
        const upperRow = this.pivotTable[j];
        if (upperRow && upperRow.mask.has(i)) {
          upperRow.mask = xorSets(upperRow.mask, currentPivot.mask);
          for (let b = 0; b < this.blockSize; b++) {
            upperRow.payload[b] ^= currentPivot.payload[b];
          }
        }
      }
    }

    const rawBuffer = new Uint8Array(this.K * this.blockSize);
    for (let i = 0; i < this.K; i++) {
      if (this.pivotTable[i] && this.pivotTable[i].payload) {
        rawBuffer.set(this.pivotTable[i].payload, i * this.blockSize);
      }
    }

    const trimmedBuffer = rawBuffer.subarray(0, this.fileSize);
    let finalBuffer = trimmedBuffer;

    // Decompress if compressed flag was enabled
    if (this.isCompressed) {
      finalBuffer = await decompressPayload(trimmedBuffer);
    }

    const actualCRC = calculateCRC32(trimmedBuffer);

    this.isComplete = true;
    this.assembledFile = {
      name: this.fileName,
      type: this.fileType,
      size: finalBuffer.length,
      data: finalBuffer,
      blob: new Blob([finalBuffer], { type: this.fileType || 'application/octet-stream' }),
      crcValid: actualCRC === this.expectedCRC,
      crc: actualCRC,
    };
  }
}

function xorSets(setA, setB) {
  const result = new Set(setA);
  for (const elem of setB) {
    if (result.has(elem)) {
      result.delete(elem);
    } else {
      result.add(elem);
    }
  }
  return result;
}
