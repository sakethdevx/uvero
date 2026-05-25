import { tools as toolboxTools } from '../../services/toolbox/tools/index.js';
import { FORMAT_REGISTRY } from '../../services/toolbox/core/unifiedProcessor.js';
import { LANGUAGES } from '../../services/compiler/data/languages.js';

const KIND = {
    QUICK: 'quick',
    TOOL: 'tool',
    PAGE: 'page',
};

const toKeywords = (...values) => {
    const flattened = values.flat().filter(Boolean).map((val) => String(val).toLowerCase());
    return Array.from(new Set(flattened));
};

const unitLabel = (unit) => {
    if (!unit) return '';
    if (unit.includes('/')) {
        return unit.split('/').pop().replace(/_/g, ' ').toUpperCase();
    }
    return unit.length <= 4 ? unit.toUpperCase() : unit.charAt(0).toUpperCase() + unit.slice(1);
};

const generateFileConverterItems = () => {
    const dynamicItems = [];

    Object.entries(FORMAT_REGISTRY).forEach(([category, config]) => {
        const catIcon = category === 'image' ? '🖼️' : category === 'document' ? '📄' : category === 'audio' ? '🎵' : '🎥';

        config.outputs.forEach(output => {
            const labelLower = output.label.toLowerCase();
            const isSpecialTool = labelLower.includes('remover') ||
                labelLower.includes('image') ||
                labelLower.includes('watermark') ||
                labelLower.includes('crop');

            dynamicItems.push({
                id: `convert-to-${output.value}`,
                title: isSpecialTool ? output.label : `${output.label} Converter`,
                description: `Convert files to ${output.label} (${output.desc}) entirely in your browser.`,
                icon: catIcon,
                path: `/toolbox?to=${output.value}`,
                kind: KIND.TOOL,
                keywords: toKeywords('convert', 'converter', 'to', output.value, output.label, category, output.desc)
            });
        });

        const primaryInputs = config.inputs.slice(0, 6);
        const primaryOutputs = config.outputs.slice(0, 6);

        primaryInputs.forEach(input => {
            primaryOutputs.forEach(output => {
                if (input.toLowerCase() === output.value.toLowerCase()) return;

                dynamicItems.push({
                    id: `convert-${input}-to-${output.value}`,
                    title: `${input.toUpperCase()} to ${output.label} Converter`,
                    description: `Instantly convert ${input.toUpperCase()} files to ${output.label} format.`,
                    icon: catIcon,
                    path: `/toolbox?to=${output.value}`,
                    kind: KIND.TOOL,
                    keywords: toKeywords(input, 'to', output.value, output.label, 'convert', 'converter', category)
                });
            });
        });
    });

    return dynamicItems;
};

const UNIT_CATEGORIES = {
    weight: {
        label: 'Weight',
        keywords: ['mass', 'scale', 'weight'],
        pairs: [['kg', 'lbs'], ['lbs', 'kg'], ['g', 'oz'], ['ton', 'kg']],
    },
    length: {
        label: 'Length',
        keywords: ['distance', 'length'],
        pairs: [['m', 'ft'], ['ft', 'm'], ['km', 'mi'], ['mi', 'km']],
    },
    temperature: {
        label: 'Temperature',
        keywords: ['temp', 'temperature'],
        pairs: [['c', 'f'], ['f', 'c'], ['c', 'k']],
    },
    volume: {
        label: 'Volume',
        keywords: ['liquid', 'volume'],
        pairs: [['l', 'gal'], ['gal', 'l'], ['ml', 'cup'], ['floz', 'ml']],
    },
    area: {
        label: 'Area',
        keywords: ['area', 'surface'],
        pairs: [['ft2', 'm2'], ['m2', 'ft2'], ['acre', 'hectare']],
    },
    speed: {
        label: 'Speed',
        keywords: ['speed', 'velocity'],
        pairs: [['mph', 'kph'], ['kph', 'mph'], ['mps', 'fps']],
    },
    time: {
        label: 'Time',
        keywords: ['time', 'duration'],
        pairs: [['hr', 'min'], ['day', 'hr'], ['week', 'day']],
    },
    timezone: {
        label: 'Timezone',
        keywords: ['timezone', 'time zone', 'tz'],
        pairs: [['America/New_York', 'America/Los_Angeles'], ['UTC', 'America/New_York']],
    },
};

const generateUnitConverterItems = () => {
    const items = [
        {
            id: 'unit-converter',
            title: 'Unit Converter',
            description: 'Convert weight, length, temperature, timezones, and more.',
            icon: '📏',
            path: '/unit-converter',
            kind: KIND.TOOL,
            keywords: toKeywords('unit', 'converter', 'convert', 'measurements', 'weight', 'length', 'temperature', 'timezone', 'universal converter'),
        },
    ];

    Object.entries(UNIT_CATEGORIES).forEach(([cat, config]) => {
        items.push({
            id: `unit-${cat}`,
            title: `${config.label} Converter`,
            description: `Convert ${config.label.toLowerCase()} units instantly.`,
            icon: '📏',
            path: `/unit-converter?cat=${cat}`,
            kind: KIND.TOOL,
            keywords: toKeywords(cat, 'converter', 'convert', config.label, config.keywords),
        });

        config.pairs.forEach(([from, to]) => {
            items.push({
                id: `unit-${cat}-${from}-${to}`,
                title: `${unitLabel(from)} to ${unitLabel(to)}`,
                description: `Convert ${unitLabel(from)} to ${unitLabel(to)}.`,
                icon: '📏',
                path: `/unit-converter?cat=${cat}&from=${from}&to=${to}`,
                kind: KIND.TOOL,
                keywords: toKeywords(from, to, 'to', cat, 'unit', 'convert', config.keywords),
            });
        });
    });

    return items;
};

const generateCompilerLanguageItems = () => {
    return LANGUAGES.map((lang) => ({
        id: `compiler-${lang.id}`,
        title: `Run ${lang.name} code`,
        description: `Open the compiler with ${lang.name} selected.`,
        icon: lang.icon || '💻',
        path: `/compiler?lang=${lang.id}`,
        kind: KIND.TOOL,
        keywords: toKeywords('run', 'code', 'compiler', 'online compiler', 'execute', lang.name, lang.id, lang.aliases || []),
    }));
};

export const SEARCH_INDEX = [
    // Quick tools
    {
        id: 'quick-qr',
        title: 'Generate QR Code',
        description: 'Quick QR generator for text, links, and WiFi.',
        icon: '🔳',
        path: '/qr-tools/generator',
        kind: KIND.QUICK,
        keywords: toKeywords('qr', 'quick', 'generate', 'wifi', 'link', 'url', 'text'),
        priority: 90,
    },
    {
        id: 'quick-clipboard',
        title: 'Quick Share Clipboard',
        description: 'Share text with a 4-digit code.',
        icon: '📋',
        path: '/clipboard',
        kind: KIND.QUICK,
        keywords: toKeywords('clipboard', 'share', 'quick', 'code', 'paste', 'send'),
        priority: 80,
    },

    // Core tools & apps
    {
        id: 'app-compiler',
        title: 'Online Compiler',
        description: 'Run code in 50+ languages instantly in your browser.',
        icon: '💻',
        path: '/compiler',
        kind: KIND.TOOL,
        keywords: toKeywords('compiler', 'ide', 'code', 'python', 'javascript', 'java', 'c++', 'run', 'execute'),
        priority: 95,
    },
    {
        id: 'app-clipboard',
        title: 'Online Clipboard',
        description: 'Secure, real-time shared clipboard.',
        icon: '📋',
        path: '/clipboard',
        kind: KIND.TOOL,
        keywords: toKeywords('clipboard', 'copy', 'paste', 'text', 'share'),
        priority: 90,
    },
    {
        id: 'app-qrtools',
        title: 'QR Tools Hub',
        description: 'Generate, scan, and manage dynamic QR codes.',
        icon: '🔳',
        path: '/qr-tools',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'code', 'scan', 'generator', 'dynamic'),
        priority: 85,
    },
    {
        id: 'qr-generator-advanced',
        title: 'QR Code Generator (Advanced)',
        description: 'Create custom QR codes with logos, frames, and beautiful templates.',
        icon: '🎨',
        path: '/qr-tools/generator',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'generator', 'custom', 'logo', 'design', 'frame', 'advanced'),
    },
    {
        id: 'qr-scanner',
        title: 'QR Code Scanner',
        description: 'Scan QR codes instantly using your camera or by uploading an image.',
        icon: '📷',
        path: '/qr-tools/scanner',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'scan', 'reader', 'decode', 'camera'),
    },
    {
        id: 'qr-validator',
        title: 'QR Code Validator',
        description: 'Check your QR code for print quality, contrast, and scan reliability.',
        icon: '✅',
        path: '/qr-tools/validator',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'validate', 'check', 'quality', 'print'),
    },
    {
        id: 'qr-bulk',
        title: 'Bulk QR Generator',
        description: 'Generate hundreds of QR codes at once from a CSV or list.',
        icon: '📦',
        path: '/qr-tools/bulk',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'bulk', 'batch', 'csv', 'mass'),
    },
    {
        id: 'qr-dynamic',
        title: 'Dynamic QR Codes',
        description: 'Create editable QR codes and track scan performance.',
        icon: '🔄',
        path: '/qr-tools/dynamic',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'dynamic', 'editable', 'track', 'analytics'),
    },
    {
        id: 'qr-analytics',
        title: 'QR Analytics',
        description: 'View scan trends, country breakdowns, and performance data.',
        icon: '📊',
        path: '/qr-tools/analytics',
        kind: KIND.TOOL,
        keywords: toKeywords('qr', 'analytics', 'data', 'stats', 'performance'),
    },
    {
        id: 'app-toolbox',
        title: 'Toolbox',
        description: 'Collection of handy browser-based utilities.',
        icon: '🛠️',
        path: '/toolbox',
        kind: KIND.TOOL,
        keywords: toKeywords('tools', 'utilities', 'converter'),
        priority: 80,
    },
    {
        id: 'app-cli',
        title: 'Uvero CLI',
        description: 'Access Uvero services directly from your terminal.',
        icon: '⌨️',
        path: '/cli',
        kind: KIND.TOOL,
        keywords: toKeywords('terminal', 'command', 'cli', 'api'),
    },

    // Compiler language shortcuts
    ...generateCompilerLanguageItems(),

    // File converters
    ...generateFileConverterItems(),

    // Unit converters
    ...generateUnitConverterItems(),

    // Utilities (from Toolbox)
    ...Object.values(toolboxTools).map((tool) => ({
        id: `tool-${tool.id}`,
        title: tool.name,
        description: tool.description,
        icon: tool.icon || '🔧',
        path: tool.workspace === 'pdf-tools' ? `/toolbox?to=${tool.id}` : `/${tool.id}`,
        kind: KIND.TOOL,
        keywords: toKeywords(tool.name, tool.category, tool.id, tool.name.toLowerCase().split(' ')),
    })),

    // Pages
    {
        id: 'page-privacy',
        title: 'Privacy Policy',
        description: 'Learn how we protect your data.',
        icon: '🛡️',
        path: '/privacy',
        kind: KIND.PAGE,
        keywords: toKeywords('privacy', 'terms', 'data', 'security'),
    },
    {
        id: 'page-contact',
        title: 'Contact Us',
        description: 'Get in touch with the Uvero team.',
        icon: '✉️',
        path: '/contact',
        kind: KIND.PAGE,
        keywords: toKeywords('contact', 'support', 'help', 'email'),
    },
    {
        id: 'page-profile',
        title: 'User Profile',
        description: 'Manage your account and settings.',
        icon: '👤',
        path: '/profile',
        kind: KIND.PAGE,
        keywords: toKeywords('account', 'settings', 'profile', 'login', 'signup'),
    },
    {
        id: 'page-home',
        title: 'Home',
        description: 'Navigate back to the Uvero main landing page.',
        icon: '🏠',
        path: '/',
        kind: KIND.PAGE,
        keywords: toKeywords('home', 'landing', 'main', 'start', 'index'),
    },
];

export const SEARCH_KIND = KIND;
