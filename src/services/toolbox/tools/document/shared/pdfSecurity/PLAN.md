# PDF Security Domain Structure Plan

## Overview
Based on the analysis of existing shared infrastructure in `src/services/toolbox/tools/document/shared/`, this document outlines the proposed structure for a new `pdfSecurity` domain to handle PDF encryption, decryption, password protection, and permission management.

## Existing Patterns Observed

### 1. Constants Pattern (`pdfConstants.js`)
- Exports string constants for MIME types, extensions
- Defines default limits (file size, count)
- Centralized error codes as object with string values
- Example: `PDF_ERROR_CODES` object with specific error identifiers

### 2. Engine Pattern (`pdfEngine.js`)
- Singleton pattern for library loading (`pdfLibInstance`, `pdfLibLoadingPromise`)
- Worker configuration function (`configurePdfjsWorker`)
- Separate loading functions for different libraries (`loadPdfLib`, `loadPdfjs`)
- Factory functions for document creation/loading (`createPdfDocument`, `loadPdfDocument`)

### 3. Utilities Pattern (`pdfUtils.js`)
- Pure utility functions for common operations
- File name manipulation (`getFileNameWithoutExtension`, `generateMergedFilename`)
- File reading helpers (`loadFileAsArrayBuffer`)
- Stateless functions with clear inputs/outputs

### 4. Validation Pattern (`pdfFileValidation.js`)
- Centralized validation logic
- Accepts new files, existing files, and options
- Returns structured result (`{ validFiles: File[], errors: string[] }`)
- Handles duplicates, size limits, type checking
- Configurable via options parameter

### 5. Page Operations Pattern (`pageOperations/`)
- Separate modules for each operation (extract, remove, reorder, rotate, split)
- Common utilities in `pageSelectionUtils.js` for parsing page ranges
- Each operation has its own engine and worker
- Consistent error handling for encrypted files

### 6. Worker Pattern (observed in module workers)
- Standard message handling pattern
- Progress reporting via `postMessage`
- Try/catch wrapping of engine calls
- Consistent message types: `progress`, `success`, `error`
- Uses `self.onmessage` and `self.onerror` handlers

### 7. Error Handling Pattern
- Encryption detection via `error.message.includes('encrypt')`
- Consistent user-friendly error messages
- Preservation of original error details when re-throwing

## Proposed pdfSecurity Domain Structure

```
src/services/toolbox/tools/document/shared/pdfSecurity/
├── pdfSecurityConstants.js
├── pdfSecurityEngine.js
├── pdfSecurityUtils.js
├── pdfSecurityValidation.js
├── encrypt/
│   ├── engine.js
│   └── worker.js
├── decrypt/
│   ├── engine.js
│   └── worker.js
├── changePassword/
│   ├── engine.js
│   └── worker.js
└── managePermissions/
    ├── engine.js
    └── worker.js
```

### 1. Constants (`pdfSecurityConstants.js`)
```javascript
export const PDF_SECURITY_ERROR_CODES = {
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
    DECRYPTION_FAILED: 'DECRYPTION_FAILED',
    PERMISSIONS_ERROR: 'PERMISSIONS_ERROR',
    INVALID_SECURITY_OPTIONS: 'INVALID_SECURITY_OPTIONS',
};

export const ENCRYPTION_ALGORITHMS = {
    AES_128: 'AES_128',
    AES_256: 'AES_256',
    RC4_40: 'RC4_40',
    RC4_128: 'RC4_128',
};

export const PERMISSION_FLAGS = {
    PRINT: 0x04,
    MODIFY_CONTENTS: 0x08,
    COPY: 0x10,
    MODIFY_ANNOTATIONS: 0x20,
    FILL_FORM: 0x100,
    COPY_FOR_ACCESSIBILITY: 0x200,
    ASSEMBLE_DOCUMENT: 0x400,
    HIGH_QUALITY_PRINT: 0x800,
};
```

### 2. Engine (`pdfSecurityEngine.js`)
- Singleton pattern for PDF library loading (reusing or extending existing pdfEngine)
- Functions for:
  - Loading PDF libraries (both pdf-lib and pdfjs-dist as needed)
  - Creating encrypted PDF documents
  - Decrypting/loading protected PDFs
  - Managing password protection
  - Setting permissions

### 3. Utilities (`pdfSecurityUtils.js`)
- Password strength validation
- Permission mask calculations
- Encryption metadata helpers
- File naming for secured documents

### 4. Validation (`pdfSecurityValidation.js`)
- Validate password inputs (strength, confirmation)
- Validate encryption options
- Validate permission flags
- Check file compatibility with security operations

### 5. Operation Modules
Each operation (encrypt, decrypt, changePassword, managePermissions) follows the established pattern:
- `engine.js`: Core logic using shared engine/utils
- `worker.js`: Standard worker wrapper with progress reporting

## Integration Points
- Import from existing shared modules where appropriate:
  - `pdfConstants` for base PDF constants
  - `pdfEngine` for PDF library loading (extend if needed)
  - `pdfUtils` for file operations
  - `pdfFileValidation` for base validation patterns
- Export constants and functions for use by specific tool implementations
- Follow existing error handling patterns for consistency
- Use worker pattern for off-main-thread processing

## Security Considerations
- Never store or transmit passwords in plain text
- Use Web Crypto API for password-based encryption where available
- Ensure proper cleanup of sensitive data in memory
- Provide clear user feedback about security operations
- Follow principle of least privilege for permissions
