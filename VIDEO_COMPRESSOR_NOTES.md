# Video Compressor - FFmpeg.wasm Integration

## ✅ Installation Complete

FFmpeg packages have been successfully installed:

- `@ffmpeg/ffmpeg` (v0.12.x)
- `@ffmpeg/util` (v0.12.x)

## 🎯 Features Implemented

### Real Video Compression

- **H.264 codec** with libx264 encoder
- **Quality levels**: Low (CRF 32), Medium (CRF 28), High (CRF 23), Very High (CRF 18), Max (CRF 15)
- **Resolution options**: Original, 480p, 720p, 1080p
- **Audio encoding**: AAC codec at 128kbps
- **Progressive streaming**: `+faststart` flag for faster web playback

### Quality (CRF) Settings

- **CRF (Constant Rate Factor)**: Lower = better quality, larger file
  - Low (32): ~70% file size reduction, noticeable quality loss
  - Medium (28): ~50-60% reduction, good for most videos
  - High (23): ~30-40% reduction, excellent quality
  - Very High (18): ~20-30% reduction, near-original quality
  - Max (15): ~10-20% reduction, visually lossless

### Resolution Scaling

- Original: No resolution change
- 1080p: 1920x1080 (Full HD)
- 720p: 1280x720 (HD)
- 480p: 854x480 (SD)

## 📁 Files Updated

1. **worker.js** - FFmpeg.wasm integration
   - Loads FFmpeg core from CDN (unpkg.com)
   - Processes video with compression settings
   - Tracks progress through FFmpeg events
   - Returns compressed video blob

2. **processor.js** - Added fileName parameter
   - Passes original filename to worker
   - Handles proper file extension detection

3. **VideoCompressor.jsx** - Already had full UI
   - Quality selection
   - Resolution options
   - Progress tracking
   - Before/after comparison

## 🚀 Usage

1. **Upload a video** (MP4, WebM, OGG, MOV - max 500MB)
2. **Select quality level** (Low to Max)
3. **Choose resolution** (Original or downscale to 1080p/720p/480p)
4. **Compress** - FFmpeg processes video in browser
5. **Download** - Get compressed MP4 file

## ⚠️ Important Notes

### First Load

- FFmpeg core files (~30MB) download on first use
- Cached by browser for subsequent compressions
- Shows "Initializing..." progress

### Performance

- Large videos take time (browser-based processing)
- 1GB video may take 5-10 minutes
- Progress bar shows real-time FFmpeg progress

### Recommendations

- **Social media**: Medium quality + 720p
- **Email/messaging**: Low quality + 480p
- **Archiving**: High/Very High + Original
- **Web streaming**: Medium/High + 1080p

## 🔧 Technical Details

### FFmpeg Command Generated

```bash
ffmpeg -i input.mp4 \
  -vf scale=1280:720 \        # If resolution selected
  -c:v libx264 \               # Video codec
  -crf 23 \                    # Quality (varies by selection)
  -preset medium \             # Encoding speed
  -c:a aac \                   # Audio codec
  -b:a 128k \                  # Audio bitrate
  -movflags +faststart \       # Web optimization
  output.mp4
```

### Browser Support

- Modern browsers with WebAssembly support
- Chrome 57+, Firefox 52+, Safari 11+, Edge 16+

### Memory Usage

- FFmpeg.wasm loads ~30MB WASM files
- Video processing uses ~2x file size in memory
- Large videos may cause issues on low-memory devices

## 🎉 Result

The Video Compressor is now **fully functional** with real FFmpeg-powered compression!

Test it at: <http://localhost:5173/video-compressor>
