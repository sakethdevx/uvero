# Uvero - Professional File Processing Platform

> 🚀 A production-ready, privacy-first file processing web application that runs entirely in the browser

## 🎯 Project Overview

Uvero is a FreeConvert-like platform built with modern web technologies. All file processing happens **client-side** - no uploads, no servers, completely private.

### ✨ Key Features

- **100% Privacy-First**: All processing happens in your browser
- **Offline-Ready**: Works without internet after initial load
- **Production-Ready**: Built with scalability and performance in mind
- **SEO Optimized**: Proper meta tags, structured data, and routing
- **Web Worker Processing**: No UI freezing, even on large files
- **Responsive Design**: Works perfectly on all devices
- **Free & Open Source**: No hidden costs, transparent code

## 🛠️ Tech Stack

- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v3** - Utility-first styling
- **React Router** - Client-side routing
- **Web Workers** - Heavy processing off main thread
- **Canvas API** - Image processing
- **JavaScript (ES6+)** - No TypeScript dependency

## 📁 Project Structure

```
uvero/
├── src/
│   ├── tools/                      # All tool modules
│   │   ├── image/
│   │   │   ├── image-compressor/
│   │   │   │   ├── ImageCompressor.jsx   # Main component
│   │   │   │   ├── processor.js          # Worker manager
│   │   │   │   ├── worker.js             # Web Worker
│   │   │   │   └── seo.json              # SEO metadata
│   │   │   └── image-converter/  # (coming soon)
│   │   ├── pdf/                   # (coming soon)
│   │   ├── audio/                 # (coming soon)
│   │   └── index.js               # Tool registry
│   ├── shared/                    # Reusable components
│   │   ├── Dropzone.jsx           # File upload
│   │   ├── Button.jsx             # Styled buttons
│   │   ├── ProgressBar.jsx        # Progress indicator
│   │   └── FileInfo.jsx           # File details display
│   ├── pages/                     # Route pages
│   │   ├── Home.jsx               # Landing page
│   │   ├── ToolPage.jsx           # Dynamic tool loader
│   │   └── Privacy.jsx            # Privacy policy
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── public/
├── index.html                     # HTML template with SEO
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── vite.config.js                 # Vite configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Navigate to project directory
cd uvero

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## 🎨 Current Features

### ✅ Phase 1 Complete: Image Compressor

A fully functional image compression tool with:

- **Supported Formats**: JPG, PNG, WebP
- **Adjustable Quality**: 10-100% compression slider
- **Real-time Preview**: See your image before compressing
- **Size Comparison**: Visual before/after file size comparison
- **Download**: One-click download of compressed image
- **Progress Indicator**: Real-time processing feedback
- **Error Handling**: User-friendly error messages
- **Web Worker**: Smooth performance, no UI freezing
- **Privacy Message**: Clear communication about data handling
- **SEO Optimized**: Dedicated route with metadata
- **FAQ Section**: Comprehensive information for users

## 🔮 Roadmap

### Phase 2: Image Converter

- Convert between JPG, PNG, WebP, GIF
- Batch conversion support
- Custom dimension settings

### Phase 3: PDF Tools

- PDF compression
- PDF merge/split
- PDF to image conversion

### Phase 4: Audio Tools

- Audio compression
- Format conversion
- Audio trimming

### Phase 5: Advanced Features

- Batch processing (Pro plan)
- Google AdSense integration
- User preferences storage
- PWA support for offline use

## 🏗️ Architecture Principles

### Scalability

- **Modular Tool System**: Each tool is self-contained
- **Easy Tool Addition**: Drop new tools into `/tools` directory
- **Shared Components**: Reusable UI components
- **Tool Registry**: Central management in `tools/index.js`

### Performance

- **Web Workers**: Heavy processing off main thread
- **Code Splitting**: Dynamic imports for tools
- **Optimized Images**: Lazy loading and compression
- **Minimal Bundle**: Tree-shaking unused code

### Privacy

- **No Server Uploads**: All processing client-side
- **No Analytics by Default**: Privacy-focused
- **Clear Communication**: Privacy badges and messages
- **Open Source**: Transparent and auditable

### SEO

- **Dedicated Routes**: Each tool has its own URL
- **Meta Tags**: Title, description, OG tags
- **Structured Data**: SEO.json for each tool
- **FAQ Sections**: Rich content for search engines

## 📝 Adding New Tools

To add a new tool, follow this pattern:

1. **Create Tool Directory**:

   ```
   src/tools/<category>/<tool-name>/
   ```

2. **Required Files**:
   - `ToolName.jsx` - Main component
   - `processor.js` - Business logic
   - `worker.js` - Web Worker (if needed)
   - `seo.json` - SEO metadata

3. **Register Tool** in `src/tools/index.js`:

   ```javascript
   import NewTool from './category/new-tool/NewTool';
   import newToolSEO from './category/new-tool/seo.json';

   export const tools = {
     'new-tool': {
       id: 'new-tool',
       name: 'New Tool',
       description: 'Tool description',
       component: NewTool,
       category: 'category',
       seo: newToolSEO,
       icon: '🔧',
       popular: false
     },
     // ... other tools
   };
   ```

4. **SEO Configuration** (`seo.json`):

   ```json
   {
     "title": "Tool Name - Description",
     "description": "Detailed description for search engines",
     "keywords": ["keyword1", "keyword2"],
     "route": "/tool-route"
   }
   ```

## 🎨 Design System

### Colors

- **Primary**: Blue (#0ea5e9)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Gray Scale**: Tailwind default

### Components

- All components in `src/shared/`
- Follow existing patterns for consistency
- Use Tailwind utility classes only

## 🔐 Privacy & Security

- **No data collection**: Files never leave the browser
- **No server**: Static hosting only
- **No cookies**: Except for essential preferences
- **Open source**: Code is transparent and auditable
- **HTTPS**: All connections encrypted

## 🤝 Contributing

This is a production project. When adding features:

1. Follow the existing code structure
2. Add proper comments and documentation
3. Test thoroughly on different devices
4. Ensure privacy principles are maintained
5. Update this README if needed

## 📄 License

MIT License - Feel free to use for your own projects

## 🙏 Credits

Built with modern web technologies and a focus on user privacy.

---

**Status**: Phase 1 Complete ✅  
**Next**: Waiting for instruction to continue development

## 🐛 Known Issues

None currently. All Phase 1 features are working as expected.

---

**Made with ❤️ for privacy-conscious users**
