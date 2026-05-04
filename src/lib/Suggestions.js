/**
 * Suggestions — Contextual next-action suggestions and smart error recovery.
 * 
 * After every successful execution, suggests next logical actions.
 * On errors, provides guided recovery alternatives.
 */

// ─── Result Suggestions by capability ───
export const RESULT_SUGGESTIONS = {
  'file-convert': {
    default: [
      { label: 'Convert to WebP', icon: '🖼️', intent: 'convert file to webp', reuseInput: true },
      { label: 'Compress further', icon: '📦', intent: 'compress file', reuseInput: true },
      { label: 'Share via clipboard', icon: '📋', intent: 'share text', reuseInput: false },
      { label: 'Convert another file', icon: '🔄', action: 'reset' },
    ],
    image: [
      { label: 'Convert to WebP', icon: '🖼️', intent: 'convert image to webp', reuseInput: true },
      { label: 'Resize image', icon: '📐', intent: 'resize image', reuseInput: true },
      { label: 'Remove background', icon: '🪄', intent: 'remove background', reuseInput: true },
      { label: 'Convert another', icon: '🔄', action: 'reset' },
    ],
    audio: [
      { label: 'Convert to MP3', icon: '🎵', intent: 'convert audio to mp3', reuseInput: true },
      { label: 'Convert to WAV', icon: '🔊', intent: 'convert audio to wav', reuseInput: true },
      { label: 'Convert another', icon: '🔄', action: 'reset' },
    ],
    video: [
      { label: 'Convert to MP4', icon: '🎥', intent: 'convert video to mp4', reuseInput: true },
      { label: 'Convert to WebM', icon: '🌐', intent: 'convert video to webm', reuseInput: true },
      { label: 'Convert another', icon: '🔄', action: 'reset' },
    ],
    document: [
      { label: 'Convert to PDF', icon: '📄', intent: 'convert document to pdf', reuseInput: true },
      { label: 'Convert to Markdown', icon: '📝', intent: 'convert document to md', reuseInput: true },
      { label: 'Convert another', icon: '🔄', action: 'reset' },
    ],
  },

  'qr-generate-quick': {
    default: [
      { label: 'Download as SVG', icon: '🖼️', action: 'downloadSVG' },
      { label: 'Add logo (advanced)', icon: '🎨', intent: 'advanced qr generator', reuseInput: false },
      { label: 'Generate another', icon: '🔄', action: 'reset' },
      { label: 'Share QR via clipboard', icon: '📋', intent: 'share text', reuseInput: false },
    ],
  },
  
  'qr-scan': {
    default: [
      { label: 'Scan another', icon: '🔄', action: 'reset' },
      { label: 'Generate QR for this', icon: '🔳', intent: 'generate qr', reuseInput: true },
      { label: 'Share via clipboard', icon: '📋', intent: 'share text', reuseInput: true },
    ],
  },

  'clipboard-share': {
    default: [
      { label: 'Share another', icon: '🔄', action: 'reset' },
      { label: 'Generate QR for code', icon: '🔳', intent: 'generate qr', reuseInput: false },
      { label: 'Open clipboard board', icon: '📋', intent: 'open clipboard', reuseInput: false },
    ],
  },
};

/**
 * Get contextual suggestions based on the completed action.
 * @param {string} capabilityId - The ID of the capability that was executed
 * @param {object} context - Additional context (category, format, etc.)
 * @returns {Array} Suggestion chips to render
 */
export function getSuggestions(capabilityId, context = {}) {
  const capSuggestions = RESULT_SUGGESTIONS[capabilityId];
  if (!capSuggestions) return [];

  // Try to get category-specific suggestions first
  const category = context.category || context.inputCategory;
  if (category && capSuggestions[category]) {
    return capSuggestions[category];
  }

  return capSuggestions.default || [];
}


// ─── Smart Error Recovery ───
const ERROR_PATTERNS = [
  {
    match: /unsupported|not supported|unknown format/i,
    title: "This format isn't supported yet",
    suggestions: [
      { label: 'Try a different format', icon: '🔄', action: 'reset' },
      { label: 'Convert to WebP instead', icon: '🖼️', intent: 'convert file to webp' },
      { label: 'Compress instead', icon: '📦', intent: 'compress file' },
    ],
  },
  {
    match: /too large|file size|exceed|quota|memory/i,
    title: "This file is too large to process",
    suggestions: [
      { label: 'Compress first', icon: '📦', intent: 'compress file' },
      { label: 'Upload a smaller file', icon: '📄', action: 'reset' },
      { label: 'Open full toolbox', icon: '🛠️', intent: 'open toolbox' },
    ],
  },
  {
    match: /network|fetch|api|server|timeout|offline/i,
    title: "Connection issue",
    suggestions: [
      { label: 'Try again', icon: '🔄', action: 'retry' },
      { label: 'Try a local-only tool', icon: '⚡', intent: 'convert file' },
    ],
  },
  {
    match: /corrupt|invalid|broken|parse|read/i,
    title: "Couldn't read this file",
    suggestions: [
      { label: 'Upload a different file', icon: '📄', action: 'reset' },
      { label: 'Try a different format', icon: '🔄', action: 'reset' },
    ],
  },
  {
    match: /wasm|engine|load|initialize/i,
    title: "Processing engine failed to load",
    suggestions: [
      { label: 'Try again', icon: '🔄', action: 'retry' },
      { label: 'Open full toolbox', icon: '🛠️', intent: 'open toolbox' },
    ],
  },
];

/**
 * Get smart error recovery for a given error message.
 * @param {string} errorMessage - The raw error message
 * @returns {{ title: string, suggestions: Array }}
 */
export function getErrorRecovery(errorMessage) {
  if (!errorMessage) {
    return {
      title: 'Something went wrong',
      suggestions: [
        { label: 'Try again', icon: '🔄', action: 'retry' },
        { label: 'Start over', icon: '↩️', action: 'reset' },
      ],
    };
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.match.test(errorMessage)) {
      return { title: pattern.title, suggestions: pattern.suggestions };
    }
  }

  // Fallback
  return {
    title: "Couldn't complete this action",
    suggestions: [
      { label: 'Try again', icon: '🔄', action: 'retry' },
      { label: 'Start over', icon: '↩️', action: 'reset' },
      { label: 'Open full toolbox', icon: '🛠️', intent: 'open toolbox' },
    ],
  };
}
