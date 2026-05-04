/**
 * IntentEngine — Core intent resolution module for Uvero
 * 
 * Maps natural language inputs like "compress image", "generate qr for wifi",
 * "share text" into actionable capabilities with tier classification.
 * 
 * Tiers:
 *   1 = Inline execution (ActionPanel)
 *   2 = Focused inline with "Open full tool" escape hatch
 *   3 = Navigate to full page
 */

import { SEARCH_INDEX } from '../components/Search/searchIndex.js';

// ─── Synonym map: user language → canonical verbs ───
const SYNONYM_MAP = {
  convert:   ['transform', 'change', 'turn into', 'make into', 'export as', 'save as', 'switch to'],
  compress:  ['optimize', 'reduce', 'shrink', 'minify', 'make smaller', 'squeeze', 'compact'],
  generate:  ['create', 'make', 'build', 'produce', 'get'],
  share:     ['send', 'post', 'distribute', 'publish', 'transfer', 'paste'],
  scan:      ['read', 'decode', 'detect', 'capture'],
  split:     ['divide', 'share expense', 'calculate'],
  run:       ['execute', 'compile', 'interpret', 'test'],
  remove:    ['delete', 'strip', 'erase', 'clear'],
  resize:    ['scale', 'enlarge', 'shrink', 'dimensions'],
  crop:      ['trim', 'cut', 'clip', 'slice'],
};

// ─── Capability definitions with regex patterns ───
const CAPABILITIES = [
  // Tier 1 — Inline execution
  {
    id: 'file-convert',
    tier: 1,
    handler: 'FileConvertPanel',
    label: 'Convert File',
    icon: '⚡',
    patterns: [
      /(?:convert|transform|change|export|save)\s+(?:.*?)\s+(?:to|into|as)\s+(\w+)/i,
      /(?:convert|compress|optimize|reduce|shrink)\s+(?:image|photo|picture|img|jpeg|jpg|png)/i,
      /(?:convert|transform)\s+(?:audio|video|document|pdf|doc|file)/i,
      /(\w+)\s+to\s+(\w+)\s+(?:converter|conversion)/i,
      /(?:compress|optimize|reduce)\s+(?:file|image|photo|video|audio)/i,
      /(?:make|get)\s+(?:.*?)\s+smaller/i,
    ],
    extractParams: (query) => {
      // Try to extract "to FORMAT"
      const toMatch = query.match(/(?:to|into|as)\s+(\w+)/i);
      const format = toMatch ? toMatch[1].toLowerCase() : null;
      
      // Try to detect category
      const categoryMap = {
        image: /image|photo|picture|img|jpeg|jpg|png|webp|gif|bmp|avif|heic|tiff|svg/i,
        audio: /audio|music|sound|song|mp3|wav|flac|ogg|aac/i,
        video: /video|clip|movie|mp4|mkv|mov|avi|webm/i,
        document: /document|doc|pdf|docx|epub|markdown|md|txt|html|csv/i,
      };
      
      let category = null;
      for (const [cat, regex] of Object.entries(categoryMap)) {
        if (regex.test(query)) { category = cat; break; }
      }
      
      return { format, category };
    },
    description: (params) => {
      const cat = params.category ? `${params.category.charAt(0).toUpperCase() + params.category.slice(1)}` : 'File';
      const fmt = params.format ? ` → ${params.format.toUpperCase()}` : '';
      return `${cat}${fmt}`;
    },
  },
  {
    id: 'qr-generate-quick',
    tier: 1,
    handler: 'QRQuickPanel',
    label: 'Generate QR Code',
    icon: '🔳',
    patterns: [
      /(?:generate|create|make|build)\s+(?:a\s+)?qr\s*(?:code)?(?:\s+(?:for|of|with))?\s*(?:url|link|text|wifi)?/i,
      /(?:generate|create|make|build)\s+(?:wifi\s+)qr/i,
      /qr\s*(?:code)?\s+(?:for|of)\s+/i,
      /(?:quick|simple|fast)\s+qr/i,
      /qr\s+wifi/i,
    ],
    extractParams: (query) => {
      // Try to detect wifi
      if (/wifi/i.test(query)) {
        return { type: 'wifi' };
      }
      
      // Try to extract a URL from the query
      const urlMatch = query.match(/(https?:\/\/[^\s]+)/i);
      const textMatch = query.match(/(?:for|of|with)\s+(.+)$/i);
      return {
        type: 'text',
        url: urlMatch ? urlMatch[1] : null,
        text: !urlMatch && textMatch ? textMatch[1].trim() : null,
      };
    },
    description: (params) => params.type === 'wifi' ? 'WiFi → QR Code' : 'URL or Text → QR Code',
  },
  {
    id: 'clipboard-share',
    tier: 1,
    handler: 'ClipboardQuickPanel',
    label: 'Quick Share',
    icon: '📋',
    patterns: [
      /(?:share|send|post|paste|publish)\s+(?:text|snippet|code|content|note|message)/i,
      /(?:clipboard|clip|copy)\s*(?:share|send)/i,
      /(?:quick|instant)\s*share/i,
      /share\s+(?:via|through|with)\s+clipboard/i,
    ],
    extractParams: () => ({}),
    description: () => 'Text → 4-digit code',
  },

  // Tier 2 — Focused inline with escape hatch
  {
    id: 'qr-generate-advanced',
    tier: 2,
    handler: null,
    navigateTo: '/qr-tools/generator',
    label: 'Advanced QR Generator',
    icon: '🎨',
    patterns: [
      /(?:generate|create|make)\s+(?:a\s+)?(?:custom|advanced|styled|branded)\s+qr/i,
      /qr\s+(?:with|using)\s+(?:logo|frame|template|color|design)/i,
      /(?:generate|create)\s+qr\s+(?:for|of)\s+(?:upi|vcard|email|sms|whatsapp|contact)/i,
    ],
    extractParams: (query) => {
      // Detect QR sub-type
      const typeMap = { wifi: /wifi/i, upi: /upi|payment/i, vcard: /vcard|contact/i, email: /email/i, sms: /sms/i, whatsapp: /whatsapp/i };
      let type = null;
      for (const [t, regex] of Object.entries(typeMap)) {
        if (regex.test(query)) { type = t; break; }
      }
      return { type };
    },
    description: (params) => params.type ? `QR Code (${params.type})` : 'Custom QR Code',
  },
  {
    id: 'qr-bulk',
    tier: 2,
    handler: null,
    navigateTo: '/qr-tools/bulk',
    label: 'Bulk QR Generator',
    icon: '📦',
    patterns: [
      /(?:bulk|batch|mass|csv)\s+(?:generate|create|make)\s+qr/i,
      /qr\s+(?:bulk|batch|csv)/i,
    ],
    extractParams: () => ({}),
    description: () => 'Generate hundreds via CSV',
  },
  {
    id: 'qr-validator',
    tier: 2,
    handler: null,
    navigateTo: '/qr-tools/validator',
    label: 'QR Validator',
    icon: '✅',
    patterns: [
      /(?:validate|check|verify|test)\s+(?:a\s+)?qr\s*(?:code)?/i,
      /qr\s+(?:validator|checker|verifier)/i,
      /(?:print|quality|reliability)\s+qr/i,
    ],
    extractParams: () => ({}),
    description: () => 'Check print & scan quality',
  },
  {
    id: 'qr-analytics',
    tier: 2,
    handler: null,
    navigateTo: '/qr-tools/analytics',
    label: 'QR Analytics',
    icon: '📊',
    patterns: [
      /qr\s+(?:analytics|stats|performance|data|tracking)/i,
      /(?:view|show|track)\s+qr\s+(?:scans|stats)/i,
    ],
    extractParams: () => ({}),
    description: () => 'Track scan performance',
  },
  {
    id: 'qr-dynamic',
    tier: 2,
    handler: null,
    navigateTo: '/qr-tools/dynamic',
    label: 'Dynamic QR Codes',
    icon: '🔄',
    patterns: [
      /(?:dynamic|editable|changeable)\s+qr/i,
      /qr\s+dynamic/i,
    ],
    extractParams: () => ({}),
    description: () => 'Edit destinations after printing',
  },
  {
    id: 'image-crop',
    tier: 2,
    handler: null,
    navigateTo: '/toolbox?to=crop',
    label: 'Crop Image',
    icon: '✂️',
    patterns: [
      /(?:crop|trim|cut|clip)\s+(?:image|photo|picture|img)/i,
      /(?:image|photo)\s+(?:crop|trim|cut)/i,
    ],
    extractParams: () => ({ category: 'image', format: 'crop' }),
    description: () => 'Image → Cropped',
  },
  {
    id: 'image-resize',
    tier: 2,
    handler: null,
    navigateTo: '/toolbox?to=resize',
    label: 'Resize Image',
    icon: '📐',
    patterns: [
      /(?:resize|scale|enlarge|dimensions)\s+(?:image|photo|picture|img)/i,
      /(?:image|photo)\s+(?:resize|scale)/i,
      /(?:change|set)\s+(?:image|photo)\s+(?:size|dimensions)/i,
    ],
    extractParams: () => ({ category: 'image', format: 'resize' }),
    description: () => 'Image → Resized',
  },
  {
    id: 'bg-remove',
    tier: 2,
    handler: null,
    navigateTo: '/toolbox?to=remove-background',
    label: 'Remove Background',
    icon: '🪄',
    patterns: [
      /(?:remove|delete|strip|erase|clear)\s+(?:image\s+)?(?:background|bg)/i,
      /(?:background|bg)\s+(?:remove|remover|removal|eraser)/i,
      /(?:transparent|cutout)\s+(?:image|photo|background)/i,
    ],
    extractParams: () => ({ category: 'image', format: 'remove-background' }),
    description: () => 'Image → Transparent',
  },
  {
    id: 'qr-scan',
    tier: 1,
    handler: 'QRQuickPanel',
    navigateTo: '/qr-tools/scanner',
    label: 'Scan QR Code',
    icon: '📷',
    patterns: [
      /(?:scan|read|decode|detect|capture)\s+(?:a\s+)?qr\s*(?:code)?/i,
      /qr\s+(?:scanner|reader)/i,
    ],
    extractParams: () => ({ type: 'scanner' }),
    description: () => 'Upload or Camera → Decode',
  },

  // Tier 3 — Navigate to full page
  {
    id: 'run-code',
    tier: 3,
    handler: null,
    navigateTo: '/compiler',
    label: 'Run Code',
    icon: '💻',
    patterns: [
      /(?:run|execute|compile|interpret|test)\s+(?:code|python|javascript|java|c\+\+|cpp|c|go|rust|ruby|php|typescript|swift)/i,
      /(?:code|programming)\s+(?:editor|ide|playground)/i,
      /(?:online)\s+(?:compiler|interpreter|ide)/i,
    ],
    extractParams: (query) => {
      const langMap = {
        python: /python|py/i, javascript: /javascript|js|node/i, java: /\bjava\b/i,
        cpp: /c\+\+|cpp/i, c: /\bc\b/i, go: /\bgo\b|golang/i, rust: /rust/i,
        ruby: /ruby/i, php: /php/i, typescript: /typescript|ts/i, swift: /swift/i,
      };
      let lang = null;
      for (const [l, regex] of Object.entries(langMap)) {
        if (regex.test(query)) { lang = l; break; }
      }
      return { lang };
    },
    description: (params) => params.lang ? `${params.lang} IDE` : 'Code Playground',
  },
  {
    id: 'split-expense',
    tier: 3,
    handler: null,
    navigateTo: '/split-expense',
    label: 'Split Bills',
    icon: '💸',
    patterns: [
      /(?:split|divide)\s+(?:bill|expense|cost|payment|trip)/i,
      /(?:expense|bill)\s+(?:split|splitter|calculator|divide)/i,
      /(?:share|calculate)\s+(?:expense|bill|cost)/i,
    ],
    extractParams: () => ({}),
    description: () => 'Group expenses',
  },
  {
    id: 'photodrop',
    tier: 3,
    handler: null,
    navigateTo: '/photodrop',
    label: 'PhotoDrop',
    icon: '📸',
    patterns: [
      /(?:photo|image)\s+(?:drop|share|event|album)/i,
      /photodrop/i,
      /(?:share|upload)\s+(?:event\s+)?photos/i,
    ],
    extractParams: () => ({}),
    description: () => 'Photo sharing',
  },
  {
    id: 'clipboard-board',
    tier: 3,
    handler: null,
    navigateTo: '/clipboard',
    label: 'Clipboard Board',
    icon: '📋',
    patterns: [
      /(?:clipboard|private)\s+board/i,
      /(?:manage|view|open)\s+clipboard/i,
    ],
    extractParams: () => ({}),
    description: () => 'Manage boards',
  },
];

// ─── Fuzzy matching (Levenshtein) ───
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function calculateScore(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  if (!q || !t) return 0;

  // 1. Exact match (highest priority)
  if (q === t) return 1.0;
  
  // 2. Starts-with match
  if (t.startsWith(q)) {
    // Prefer shorter strings that start with the query
    return 0.8 + (q.length / t.length) * 0.1; // Range: 0.8 - 0.9
  }
  
  // 3. Includes match
  if (t.includes(q)) {
    return 0.6 + (q.length / t.length) * 0.1; // Range: 0.6 - 0.7
  }
  
  // 4. Fuzzy match (fallback)
  const dist = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  const fuzzy = Math.max(0, 1 - dist / maxLen);
  
  return fuzzy * 0.4; // Range: 0.0 - 0.4
}

// ─── Normalize query: expand synonyms to canonical verbs ───
function normalizeQuery(query) {
  let normalized = query.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      if (normalized.includes(syn)) {
        normalized = normalized.replace(syn, canonical);
      }
    }
  }
  return normalized;
}

// ─── Main resolver ───
export function resolveIntent(rawQuery) {
  if (!rawQuery || rawQuery.trim().length === 0) {
    return { capability: null, confidence: 0, suggestions: [] };
  }

  const query = normalizeQuery(rawQuery);
  
  // 1. Try regex patterns (highest confidence)
  for (const cap of CAPABILITIES) {
    for (const pattern of cap.patterns) {
      if (pattern.test(query)) {
        const params = cap.extractParams ? cap.extractParams(query) : {};
        return {
          capability: cap,
          params,
          confidence: 0.9,
          label: cap.label,
          description: cap.description(params),
          tier: cap.tier,
          handler: cap.handler,
          navigateTo: cap.navigateTo || null,
          suggestions: getRelatedSuggestions(cap.id, rawQuery),
        };
      }
    }
  }

  // 2. Fuzzy match against searchIndex
  const scored = SEARCH_INDEX
    .map(item => {
      const titleScore = calculateScore(rawQuery, item.title);
      const keywordScores = item.keywords.map(k => calculateScore(rawQuery, k));
      const bestKeyword = Math.max(...keywordScores, 0);
      
      // Exact keyword matches should be as strong as exact title matches
      // but otherwise slightly prefer title matches
      const score = Math.max(titleScore, bestKeyword === 1.0 ? 1.0 : bestKeyword * 0.9);
      return { ...item, score };
    })
    .filter(item => item.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // DEBUGGING: Log query, matched item, and score
  console.log(`[Search Debug] Query: "${rawQuery}"`);
  scored.slice(0, 4).forEach(item => console.log(`  - ${item.title}: score=${item.score.toFixed(3)}`));

  if (scored.length > 0 && scored[0].score > 0.6) {
    // High-confidence fuzzy match — find matching capability
    const matchedCap = CAPABILITIES.find(c => {
      if (c.navigateTo && scored[0].path === c.navigateTo) return true;
      return false;
    });
    
    // Use matched capability or create a synthetic one for direct page matches
    const capability = matchedCap || {
      id: scored[0].id,
      label: scored[0].title,
      icon: scored[0].icon,
      tier: 3,
      navigateTo: scored[0].path,
      description: () => scored[0].description,
    };

    return {
      capability,
      params: {},
      confidence: scored[0].score,
      label: scored[0].title,
      description: scored[0].description,
      tier: capability.tier,
      handler: capability.handler || null,
      navigateTo: capability.navigateTo,
      suggestions: scored.slice(1).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        icon: s.icon,
        path: s.path,
        score: s.score,
      })),
    };
  }

  // 3. Low confidence — return all fuzzy suggestions
  return {
    capability: null,
    params: {},
    confidence: scored.length > 0 ? scored[0].score : 0,
    label: null,
    description: null,
    tier: null,
    handler: null,
    navigateTo: null,
    suggestions: scored.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon,
      path: s.path,
      score: s.score,
    })),
  };
}

// Helper: get related suggestions for a matched capability
function getRelatedSuggestions(capId, query) {
  return SEARCH_INDEX
    .filter(item => {
      const score = calculateScore(query, item.title);
      const keywordScores = item.keywords.map(k => calculateScore(query, k));
      return Math.max(score, ...keywordScores) > 0.2;
    })
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon,
      path: s.path,
    }));
}

// ─── Get all capabilities (for favorites/history) ───
export function getAllCapabilities() {
  return CAPABILITIES.map(c => ({
    id: c.id,
    tier: c.tier,
    label: c.label,
    icon: c.icon,
    description: c.description({}),
    handler: c.handler,
    navigateTo: c.navigateTo,
  }));
}

// ─── Placeholder suggestions for the command bar ───
export const PLACEHOLDER_INTENTS = [
  'Convert a PDF to images...',
  'Generate a QR code for WiFi...',
  'Compress this image...',
  'Share a code snippet...',
  'Resize a photo...',
  'Run Python code...',
  'Split a bill with friends...',
  'Remove image background...',
  'Convert audio to MP3...',
  'Generate a QR for a link...',
];
