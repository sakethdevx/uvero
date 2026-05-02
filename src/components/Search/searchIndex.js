import { tools as toolboxTools } from '../../services/toolbox/tools/index.js';

export const SEARCH_INDEX = [
    // Main Apps
    {
        id: 'app-compiler',
        title: 'Online Compiler',
        description: 'Run code in 50+ languages instantly in your browser.',
        icon: '💻',
        path: '/compiler',
        category: 'Apps',
        keywords: ['ide', 'code', 'python', 'javascript', 'java', 'c++'],
    },
    {
        id: 'app-photodrop',
        title: 'PhotoDrop',
        description: 'Share photos instantly with face-recognition delivery.',
        icon: '📸',
        path: '/photodrop',
        category: 'Apps',
        keywords: ['photos', 'events', 'sharing', 'face'],
    },
    {
        id: 'app-clipboard',
        title: 'Online Clipboard',
        description: 'Secure, real-time shared clipboard.',
        icon: '📋',
        path: '/clipboard',
        category: 'Apps',
        keywords: ['copy', 'paste', 'text', 'share'],
    },
    {
        id: 'app-paysplit',
        title: 'PaySplit',
        description: 'Split expenses and bills with friends easily.',
        icon: '💸',
        path: '/split-expense',
        category: 'Apps',
        keywords: ['money', 'split', 'bills', 'expense'],
    },
    {
        id: 'app-qrtools',
        title: 'QR Tools Hub',
        description: 'Generate, scan, and manage dynamic QR codes.',
        icon: '🔳',
        path: '/qr-tools',
        category: 'Apps',
        keywords: ['qr', 'code', 'scan', 'generator'],
    },
    {
        id: 'app-toolbox',
        title: 'Toolbox',
        description: 'Collection of handy browser-based utilities.',
        icon: '🛠️',
        path: '/toolbox',
        category: 'Apps',
        keywords: ['tools', 'utilities', 'converter'],
    },
    {
        id: 'app-cli',
        title: 'Uvero CLI',
        description: 'Access Uvero services directly from your terminal.',
        icon: '⌨️',
        path: '/cli',
        category: 'Apps',
        keywords: ['terminal', 'command', 'cli', 'api'],
    },

    // Utilities (from Toolbox)
    ...Object.values(toolboxTools).map((tool) => ({
        id: `tool-${tool.id}`,
        title: tool.name,
        description: tool.description,
        icon: tool.icon || '🔧',
        path: `/${tool.id}`, // Toolbox tools are at the root path, e.g. /qr-generator
        category: 'Utilities',
        keywords: [tool.name.toLowerCase(), tool.category, ...tool.name.toLowerCase().split(' ')],
    })),

    // Documentation & Pages
    {
        id: 'page-privacy',
        title: 'Privacy Policy',
        description: 'Learn how we protect your data.',
        icon: '🛡️',
        path: '/privacy',
        category: 'Pages',
        keywords: ['privacy', 'terms', 'data', 'security'],
    },
    {
        id: 'page-contact',
        title: 'Contact Us',
        description: 'Get in touch with the Uvero team.',
        icon: '✉️',
        path: '/contact',
        category: 'Pages',
        keywords: ['contact', 'support', 'help', 'email'],
    },
    {
        id: 'page-profile',
        title: 'User Profile',
        description: 'Manage your account and settings.',
        icon: '👤',
        path: '/profile',
        category: 'Pages',
        keywords: ['account', 'settings', 'profile', 'login', 'signup'],
    },
];
