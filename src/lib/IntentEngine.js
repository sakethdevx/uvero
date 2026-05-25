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
import { FORMAT_REGISTRY } from '../services/toolbox/core/unifiedProcessor.js';

// ─── Synonym map: user language → canonical verbs ───
const SYNONYM_MAP = {
  convert: ['transform', 'change', 'turn into', 'make into', 'export as', 'save as', 'switch to'],
  compress: ['optimize', 'reduce', 'shrink', 'minify', 'make smaller', 'squeeze', 'compact'],
  generate: ['create', 'make', 'build', 'produce', 'get'],
  share: ['send', 'post', 'distribute', 'publish', 'transfer', 'paste'],
  scan: ['read', 'decode', 'detect', 'capture'],
  split: ['divide', 'share expense', 'calculate'],
  run: ['execute', 'compile', 'interpret', 'test'],
  remove: ['delete', 'strip', 'erase', 'clear'],
  resize: ['scale', 'enlarge', 'shrink', 'dimensions'],
  crop: ['trim', 'cut', 'clip', 'slice'],
};

// ─── Unit Conversion Constants ───
const UNIT_NORMALIZE_MAP = {
  kilograms: 'kg', kilogram: 'kg', kgs: 'kg', pounds: 'lbs', pound: 'lbs', grams: 'g', gram: 'g', ounces: 'oz', ounce: 'oz',
  meters: 'm', meter: 'm', feet: 'ft', foot: 'ft', inches: 'in', inch: 'in', miles: 'mi', mile: 'mi',
  celsius: 'c', celcius: 'c', centigrade: 'c', fahrenheit: 'f', kelvin: 'k',
  eastern: 'America/New_York', pacific: 'America/Los_Angeles', central: 'America/Chicago', mountain: 'America/Denver',
  pst: 'America/Los_Angeles', est: 'America/New_York', cst: 'America/Chicago', mst: 'America/Denver',
  liters: 'l', liter: 'l', millilitres: 'ml', milliliter: 'ml',
  gallons: 'gal', gallon: 'gal', quarts: 'qt', quart: 'qt', pints: 'pt', pint: 'pt', cups: 'cup',
  acres: 'acre', hectares: 'hectare', sqft: 'ft2', 'sq ft': 'ft2', 'square feet': 'ft2', 'square foot': 'ft2',
  sqmeters: 'm2', 'sq m': 'm2', 'square meters': 'm2', 'square meter': 'm2',
  'sq km': 'km2', 'square kilometers': 'km2', 'sq cm': 'cm2', 'square centimeters': 'cm2',
  'sq in': 'in2', 'square inches': 'in2', 'square inch': 'in2',
  knots: 'knot', 'miles per hour': 'mph', 'kilometers per hour': 'kph', 'meters per second': 'mps', 'feet per second': 'fps',
  seconds: 's', second: 's', minutes: 'min', minute: 'min', hours: 'hr', hour: 'hr', days: 'day',
  weeks: 'week', months: 'month', years: 'year'
};

const UNIT_TO_CAT = {
  kg: 'weight', lbs: 'weight', g: 'weight', oz: 'weight', ton: 'weight', stone: 'weight',
  m: 'length', km: 'length', cm: 'length', mm: 'length', ft: 'length', in: 'length', yd: 'length', mi: 'length',
  c: 'temperature', f: 'temperature', k: 'temperature',
  'america/new_york': 'timezone', 'america/los_angeles': 'timezone', 'america/chicago': 'timezone', 'america/denver': 'timezone',
  utc: 'timezone',
  l: 'volume', ml: 'volume', gal: 'volume', qt: 'volume', pt: 'volume', cup: 'volume', floz: 'volume', m3: 'volume',
  m2: 'area', km2: 'area', cm2: 'area', ft2: 'area', in2: 'area', acre: 'area', hectare: 'area',
  mps: 'speed', kph: 'speed', mph: 'speed', fps: 'speed', knot: 'speed',
  s: 'time', min: 'time', hr: 'time', day: 'time', week: 'time', month: 'time', year: 'time'
};

const unitKeywords = Array.from(new Set([...Object.keys(UNIT_NORMALIZE_MAP), ...Object.keys(UNIT_TO_CAT)]));
unitKeywords.sort((a, b) => b.length - a.length);
const UNIT_REGEX = new RegExp(`^(?:${unitKeywords.join('|')})(?:\\s+converter)?$`, 'i');
const CATEGORIES = ['weight', 'length', 'temperature', 'volume', 'speed', 'area', 'timezone', 'time'];
const CAT_REGEX = new RegExp(`^(?:${CATEGORIES.join('|')})(?:\\s+converter)?$`, 'i');

const FILE_FORMATS = (() => {
  const formats = new Set();
  Object.values(FORMAT_REGISTRY).forEach((config) => {
    config.inputs.forEach((input) => formats.add(String(input).toLowerCase()));
    config.outputs.forEach((output) => {
      formats.add(String(output.value).toLowerCase());
      formats.add(String(output.label).toLowerCase());
    });
  });
  return formats;
})();

const getKindForPath = (path) => SEARCH_INDEX.find((item) => item.path === path)?.kind || null;

const findBestSearchItem = (query, fallbackPath) => {
  const normalized = query.toLowerCase();
  const matches = SEARCH_INDEX.filter((item) => {
    if (fallbackPath && item.path === fallbackPath) return true;
    return item.title.toLowerCase().includes(normalized) || item.keywords.some((k) => k.includes(normalized));
  });
  return matches[0] || null;
};

const parsePair = (query) => {
  const match = query.match(/([\w/]+)\s+to\s+([\w/]+)/i);
  if (!match) return null;
  return { from: match[1].toLowerCase(), to: match[2].toLowerCase() };
};

const isFileFormat = (token) => FILE_FORMATS.has(String(token).toLowerCase());

const isUnitToken = (token) => {
  const normalized = String(token).toLowerCase();
  return Boolean(UNIT_NORMALIZE_MAP[normalized] || UNIT_TO_CAT[normalized] || CATEGORIES.includes(normalized));
};

// ─── Capability definitions with regex patterns ───
const CAPABILITIES = [
  {
    id: 'unit-conversion',
    tier: 3,
    handler: null,
    navigateTo: '/unit-converter',
    label: 'Unit Converter',
    icon: '📏',
    patterns: [
      /([\w/]+)\s+to\s+([\w/]+)/i,
      /([\w/]+)\s+to\s*$/i,
      /(?:convert|transform)\s+([\w/]+)\s+to\s+([\w/]+)/i,
      /(?:convert|transform)\s+([\w/]+)\s+to\s*$/i,
      /(?:timezone|time)\s+converter/i,
      /(?:weight|length|temperature|volume|speed|area)\s+converter/i,
      UNIT_REGEX,
      CAT_REGEX,
    ],
    guard: (query, params) => {
      const pair = parsePair(query);
      if (pair && isFileFormat(pair.from) && isFileFormat(pair.to)) {
        return false;
      }
      if (params.cat) return true;
      if (params.from || params.to) return true;
      return pair ? (isUnitToken(pair.from) || isUnitToken(pair.to)) : false;
    },
    extractParams: (query) => {
      let from, to, catMatch;
      const match = query.match(/([\w/]+)\s+to\s+([\w/]+)?/i);

      if (match) {
        from = match[1].toLowerCase();
        to = (match[2] || '').toLowerCase();
      } else {
        const fullQuery = query.toLowerCase().trim().replace(/\s+converter$/, '');
        if (UNIT_NORMALIZE_MAP[fullQuery] || UNIT_TO_CAT[fullQuery]) {
          from = fullQuery;
          to = '';
        } else if (CATEGORIES.includes(fullQuery)) {
          catMatch = fullQuery;
        } else {
          const words = fullQuery.split(/\s+/);
          for (const w of words) {
            if (UNIT_NORMALIZE_MAP[w] || UNIT_TO_CAT[w]) {
              from = w;
              to = '';
              break;
            }
          }
        }
      }

      if (catMatch) {
        return { cat: catMatch };
      }

      if (from) {
        const finalFrom = UNIT_NORMALIZE_MAP[from] || from;
        const finalTo = to ? (UNIT_NORMALIZE_MAP[to] || to) : '';

        const catFrom = UNIT_TO_CAT[finalFrom.toLowerCase()];
        const catTo = finalTo ? UNIT_TO_CAT[finalTo.toLowerCase()] : null;

        const cat = catFrom || catTo || 'weight';
        return { cat, from: finalFrom, to: finalTo || null };
      }
      return {};
    },
    description: (params) => {
      if (params.from && params.to) {
        const from = params.from.includes('/') ? params.from.split('/').pop().replace('_', ' ') : params.from;
        const to = params.to.includes('/') ? params.to.split('/').pop().replace('_', ' ') : params.to;
        return `${from.toUpperCase()} → ${to.toUpperCase()}`;
      }
      if (params.from) {
        const from = params.from.includes('/') ? params.from.split('/').pop().replace('_', ' ') : params.from;
        return `Convert ${from.toUpperCase()} to other units`;
      }
      return 'Weight, Length, Timezones & more';
    },
  },
  // Tier 1 — Inline execution
  {
    id: 'file-convert',
    tier: 1,
    handler: 'FileConvertPanel',
    label: 'Convert File',
    icon: '⚡',
    patterns: [
      /([\w/]+)\s+to\s+([\w/]+)/i,
      /(?:convert|transform|change|export|save)\s+(?:.*?)\s+(?:to|into|as)\s+(\w+)/i,
      /(?:convert|compress|optimize|reduce|shrink)\s+(?:image|photo|picture|img|jpeg|jpg|png)/i,
      /(?:convert|transform)\s+(?:audio|video|document|pdf|doc|file)/i,
      /(\w+)\s+to\s+(\w+)\s+(?:converter|conversion)/i,
      /(?:compress|optimize|reduce)\s+(?:file|image|photo|video|audio)/i,
      /(?:make|get)\s+(?:.*?)\s+smaller/i,
    ],
    guard: (query, params) => {
      if (params.category) return true;
      if (params.format && isFileFormat(params.format)) return true;
      const pair = parsePair(query);
      if (!pair) return false;
      return isFileFormat(pair.from) && isFileFormat(pair.to);
    },
    extractParams: (query) => {
      // Try to extract "to FORMAT"
      const toMatch = query.match(/(?:to|into|as)\s+([\w/]+)/i);
      const format = toMatch ? toMatch[1].toLowerCase() : null;
      const pair = parsePair(query);
      const from = pair?.from || null;
      const to = pair?.to || null;

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

      return { format: to || format, from, to, category };
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

// ─── Dynamic Unit Suggestion Generator ───
function getDynamicUnitSuggestions(params) {
  if (!params.from && !params.cat) return [];

  const COMMON_UNITS = {
    weight: ['kg', 'lbs', 'g', 'oz', 'ton'],
    length: ['m', 'ft', 'in', 'km', 'mi', 'cm', 'mm'],
    temperature: ['c', 'f', 'k'],
    timezone: ['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'UTC'],
    volume: ['l', 'ml', 'gal', 'qt', 'pt', 'cup', 'floz', 'm3'],
    area: ['m2', 'km2', 'cm2', 'ft2', 'in2', 'acre', 'hectare'],
    speed: ['mps', 'kph', 'mph', 'fps', 'knot'],
    time: ['s', 'min', 'hr', 'day', 'week', 'month', 'year']
  };

  if (params.from) {
    const cat = params.cat || 'weight';
    const from = params.from;
    const units = COMMON_UNITS[cat] || [];

    return units
      .filter(u => u.toLowerCase() !== from.toLowerCase())
      .map(u => {
        const uLabel = u.includes('/') ? u.split('/').pop().replace('_', ' ') : u;
        return {
          id: `unit-gen-${from}-${u}`,
          title: `${from.toUpperCase()} to ${uLabel.toUpperCase()}`,
          description: `Quickly convert ${from.toUpperCase()} to ${uLabel.toUpperCase()}`,
          icon: '📏',
          path: `/unit-converter?cat=${cat}&from=${from}&to=${u}`,
          kind: 'tool'
        };
      });
  } else if (params.cat) {
    const cat = params.cat;
    const catPairs = {
      speed: [['mph', 'kph'], ['kph', 'mph'], ['mps', 'fps'], ['knot', 'mph']],
      area: [['acre', 'ft2'], ['ft2', 'm2'], ['m2', 'ft2'], ['hectare', 'acre']],
      volume: [['gal', 'l'], ['l', 'gal'], ['cup', 'ml'], ['floz', 'ml']],
      weight: [['kg', 'lbs'], ['lbs', 'kg'], ['g', 'oz'], ['ton', 'kg']],
      length: [['mi', 'km'], ['km', 'mi'], ['ft', 'm'], ['m', 'ft']],
      temperature: [['c', 'f'], ['f', 'c'], ['c', 'k']],
      timezone: [['America/New_York', 'America/Los_Angeles'], ['UTC', 'America/New_York']],
      time: [['hr', 'min'], ['day', 'hr'], ['week', 'day']]
    };
    const pairs = catPairs[cat] || [];
    return pairs.map(([f, t]) => {
      const fLabel = f.includes('/') ? f.split('/').pop().replace('_', ' ') : f;
      const tLabel = t.includes('/') ? t.split('/').pop().replace('_', ' ') : t;
      return {
        id: `unit-gen-cat-${cat}-${f}-${t}`,
        title: `${fLabel.toUpperCase()} to ${tLabel.toUpperCase()}`,
        description: `Quickly convert ${fLabel.toUpperCase()} to ${tLabel.toUpperCase()}`,
        icon: '📏',
        path: `/unit-converter?cat=${cat}&from=${f}&to=${t}`,
        kind: 'tool'
      };
    });
  }
  return [];
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
        if (cap.guard && !cap.guard(query, params)) {
          continue;
        }

        let navigateTo = cap.navigateTo || null;
        if (cap.id === 'run-code' && params.lang) {
          navigateTo = `/compiler?lang=${params.lang}`;
        }
        const matchItem = findBestSearchItem(rawQuery, navigateTo || cap.navigateTo);
        const kind = matchItem?.kind || getKindForPath(navigateTo || cap.navigateTo);

        const result = {
          capability: cap,
          params,
          confidence: 0.9,
          label: cap.label,
          description: cap.description(params),
          tier: cap.tier,
          handler: cap.handler,
          navigateTo,
          kind,
          suggestions: getRelatedSuggestions(cap.id, rawQuery),
        };

        // Inject dynamic unit suggestions if applicable
        if (cap.id === 'unit-conversion') {
          const dynamic = getDynamicUnitSuggestions(params);
          result.suggestions = [...dynamic, ...result.suggestions].slice(0, 10);
        }

        return result;
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
      kind: scored[0].kind,
      suggestions: scored.slice(1).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        icon: s.icon,
        path: s.path,
        kind: s.kind,
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
    kind: null,
    suggestions: scored.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon,
      path: s.path,
      kind: s.kind,
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
      kind: s.kind,
    }));
}

// ─── Get all capabilities (for favorites/history) ───
export function getAllCapabilities() {
  return CAPABILITIES.map(c => ({
    id: c.id,
    tier: c.tier,
    label: c.label,
    icon: c.icon,
    description: c.description,
    handler: c.handler,
    navigateTo: c.navigateTo,
    extractParams: c.extractParams,
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
