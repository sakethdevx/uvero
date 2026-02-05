# Online Processing API Services

This directory contains service modules for online file processing.

## ✅ Server-Side Processing Enabled

**Online mode now uses TRUE server-side processing!**

### Image Compression

#### Online Mode (Server-Side)

- **Backend**: Node.js serverless function at `/api/compress`
- **Library**: Sharp (professional-grade image processing)
- **Deployment**: Vercel serverless functions
- **Process**:
  1. File uploads to server
  2. Sharp processes image on server
  3. Compressed image returns to browser
- **Benefits**: Better compression, supports more formats, uses mozjpeg

#### Offline Mode (Client-Side)

- **Library**: Canvas API
- **Process**: All compression happens in browser
- **Benefits**: Complete privacy, works offline, no upload needed

## Vercel Serverless Functions

The `/api` folder contains serverless functions deployed with your app:

- **`/api/compress.js`**: Image compression using Sharp
- **Limits**: 50MB max file, 10s timeout (Hobby plan)
- **Scaling**: Automatic on-demand scaling
- **No extra setup**: Deployed automatically with frontend

## Additional Cloud APIs (Optional)

#### CloudConvert (Recommended)

- **Website**: <https://cloudconvert.com/api/v2>
- **Free Tier**: 25 conversions/day
- **Supports**: Images, PDFs, Documents, Videos, Audio
- **Setup**: Sign up → Get API key → Add to .env file

#### TinyPNG (Images Only)

- **Website**: <https://tinypng.com/developers>
- **Free Tier**: 500 compressions/month  
- **Best for**: Image compression

#### iLovePDF (PDF Tools)

- **Website**: <https://developer.ilovepdf.com/>
- **Free Tier**: Limited monthly requests
- **Supports**: All PDF operations
- **Setup**: Sign up → Get API key

#### PDFShift

- **Website**: <https://pdfshift.io/>
- **Free Tier**: 50 conversions/month
- **Supports**: HTML to PDF
- **Setup**: Sign up → Get API key

#### Remove.bg

- **Website**: <https://www.remove.bg/api>
- **Free Tier**: 50 images/month
- **Supports**: Background removal
- **Setup**: Sign up → Get API key

## How It Works

### Offline Mode (Default)

- All processing happens in the browser
- No file uploads
- 100% private
- Works without internet (after initial load)
- Uses: Canvas API, Web Workers, FFmpeg.wasm, etc.

### Online Mode

- Files uploaded to external APIs
- Faster for large files
- May support more formats
- Requires internet connection
- **Privacy**: Files sent to third-party servers

## Adding API Keys

Create a `.env` file in the project root:

```env
VITE_CLOUDCONVERT_API_KEY=your_key_here
VITE_ILOVEPDF_API_KEY=your_key_here
VITE_PDFSHIFT_API_KEY=your_key_here
VITE_REMOVEBG_API_KEY=your_key_here
```

Then update the service files to use these keys:

```javascript
const API_KEY = import.meta.env.VITE_CLOUDCONVERT_API_KEY;
```

## Implementation Pattern

Each service file (`imageApi.js`, `pdfApi.js`, etc.) exports:

### Functions

- `compress{Type}Online(file, options)` - Compress files
- `convert{Type}Online(file, targetFormat)` - Convert formats
- `isOnlineFeatureAvailable(feature)` - Check if feature works without API key

### Usage in Components

```javascript
import { useMode } from '../../../context/ModeContext';
import { compressImageOnline } from '../../../services/imageApi';
import processor from './processor'; // Offline processor

const MyComponent = () => {
    const { isOnlineMode } = useMode();
    
    const handleProcess = async () => {
        if (isOnlineMode) {
            // Online processing - upload to API
            const result = await compressImageOnline(file, quality);
        } else {
            // Offline processing - client-side
            const result = await processor.compress(file, quality);
        }
    };
};
```

## API Rate Limits & Monitoring

### reSmush.it (Image Compression)

- **Limit**: No official limit, but be respectful
- **Max file size**: 5MB
- **Recommendation**: Use for images under 5MB

### CloudConvert

- **Free**: 25 conversions/day
- **Tracking**: API returns remaining credits
- **Recommendation**: Show user their daily usage

## Error Handling

All API functions throw errors with user-friendly messages:

```javascript
try {
    const result = await compressImageOnline(file, quality);
} catch (error) {
    // error.message contains user-friendly text
    console.error(error.message);
    // Fallback to offline processing
    const result = await processor.compress(file, quality);
}
```

## Future Enhancements

### Potential Free APIs to Integrate

1. **Convertio** - Free tier available
2. **Online-Convert** - Limited free usage
3. **FreeConvert** - API with free tier
4. **PDF.co** - Free tier available

### Self-Hosted Options

- Set up your own processing server
- Use LibreOffice for document conversion
- Use ImageMagick for image processing
- Use FFmpeg for video/audio
- Deploy on Vercel/Netlify Functions

## Security Notes

⚠️ **Important**: Never commit API keys to git

✅ **Best practices**:

- Use environment variables
- Add `.env` to `.gitignore`
- Rotate keys regularly
- Monitor API usage
- Implement rate limiting on your end

## Privacy Considerations

When using online APIs:

- Files are uploaded to third-party servers
- Check each API's privacy policy
- Inform users about data handling
- Offer offline mode as default
- Consider self-hosted alternatives for sensitive documents

## Testing

Test with small files first:

```bash
# Set test API key
echo "VITE_CLOUDCONVERT_API_KEY=test_key" > .env.local

# Run dev server
npm run dev

# Switch to online mode in the UI
# Try compressing a small image
```

## Support

If an API is down or rate-limited:

1. App automatically falls back to offline processing
2. User sees informative error message
3. Offline mode always works as backup

## Contributing

To add a new API integration:

1. Create/update service file in `/services/`
2. Add API documentation here
3. Implement error handling
4. Add fallback to offline processing
5. Update component to use new service
6. Test with and without API key
