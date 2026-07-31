import { LTEncoder, LTDecoder, calculateCRC32 } from '../src/services/file-transfer/lib/fountain.js';

console.log('--- AirPulse Fountain Engine Comprehensive Test ---');

const testSize = 25000;
const testBytes = new Uint8Array(testSize);
for (let i = 0; i < testSize; i++) {
  testBytes[i] = (i * 31 + 17) % 256;
}

const originalCRC = calculateCRC32(testBytes);
console.log(`Original Size: ${testSize} bytes, CRC32: ${originalCRC}`);

const encoder = new LTEncoder(testBytes, 'test_document.bin', 'application/octet-stream', 'balanced');
console.log(`K = ${encoder.K} blocks, Block Size = ${encoder.blockSize}`);

const decoder = new LTDecoder();
let totalSent = 0;
let totalProcessed = 0;

for (let i = 0; i < 1200; i++) {
  const dropletJSON = encoder.nextDroplet();
  totalSent++;

  if (Math.random() < 0.40) continue;

  totalProcessed++;
  const res = decoder.processPacket(dropletJSON);

  if (totalProcessed % 20 === 0 || res.complete) {
    console.log(`Processed: ${totalProcessed} | Rank: ${decoder.rank}/${encoder.K}`);
  }

  if (res.complete) {
    console.log(`\n✅ RECONSTRUCTION COMPLETE!`);
    console.log(`Sent: ${totalSent} droplets | Received: ${totalProcessed} droplets | Rank: ${decoder.rank}/${encoder.K}`);
    console.log(`Overhead Ratio: ${(totalProcessed / encoder.K).toFixed(2)}x`);
    console.log(`CRC Check Match: ${decoder.assembledFile.crcValid ? 'YES ✓' : 'NO ✗'}`);
    process.exit(decoder.assembledFile.crcValid ? 0 : 1);
  }
}

console.error(`❌ FAIL: Rank reached ${decoder.rank}/${encoder.K} after ${totalProcessed} received droplets`);
process.exit(1);
