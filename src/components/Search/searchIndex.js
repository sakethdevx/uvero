import { tools as toolboxTools } from '../../services/toolbox/tools/index.js';
import { FORMAT_REGISTRY } from '../../services/toolbox/core/unifiedProcessor.js';

/**
 * Generate specific conversion tools based on the unified processor registry
 */
const generateDynamicConverters = () => {
    const dynamicItems = [];
    
    Object.entries(FORMAT_REGISTRY).forEach(([category, config]) => {
        const catIcon = category === 'image' ? '🖼️' : category === 'document' ? '📄' : category === 'audio' ? '🎵' : '🎥';
        
        // 1. Add generic "Convert to [Format]" for all outputs
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
                category: 'Converters',
                keywords: ['convert', 'to', output.value, output.label, category, output.desc.toLowerCase()]
            });
        });

        // 2. Add common "From X to Y" combinations for the top inputs
        // This makes the search feel very intelligent for common tasks
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
                    category: 'Converters',
                    keywords: [input, 'to', output.value, 'convert', 'transformer']
                });
            });
        });
    });
    
    return dynamicItems;
};

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
        id: 'app-clipboard',
        title: 'Online Clipboard',
        description: 'Secure, real-time shared clipboard.',
        icon: '📋',
        path: '/clipboard',
        category: 'Apps',
        keywords: ['copy', 'paste', 'text', 'share'],
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
        id: 'qr-generator-advanced',
        title: 'QR Code Generator (Advanced)',
        description: 'Create custom QR codes with logos, frames, and beautiful templates.',
        icon: '🎨',
        path: '/qr-tools/generator',
        category: 'QR Tools',
        keywords: ['qr', 'generator', 'custom', 'logo', 'design', 'frame'],
    },
    {
        id: 'qr-scanner',
        title: 'QR Code Scanner',
        description: 'Scan QR codes instantly using your camera or by uploading an image.',
        icon: '📷',
        path: '/qr-tools/scanner',
        category: 'QR Tools',
        keywords: ['qr', 'scan', 'reader', 'decode', 'camera'],
    },
    {
        id: 'qr-validator',
        title: 'QR Code Validator',
        description: 'Check your QR code for print quality, contrast, and scan reliability.',
        icon: '✅',
        path: '/qr-tools/validator',
        category: 'QR Tools',
        keywords: ['qr', 'validate', 'check', 'quality', 'print'],
    },
    {
        id: 'qr-bulk',
        title: 'Bulk QR Generator',
        description: 'Generate hundreds of QR codes at once from a CSV or list.',
        icon: '📦',
        path: '/qr-tools/bulk',
        category: 'QR Tools',
        keywords: ['qr', 'bulk', 'batch', 'csv', 'mass'],
    },
    {
        id: 'qr-dynamic',
        title: 'Dynamic QR Codes',
        description: 'Create editable QR codes and track scan performance.',
        icon: '🔄',
        path: '/qr-tools/dynamic',
        category: 'QR Tools',
        keywords: ['qr', 'dynamic', 'editable', 'track', 'analytics'],
    },
    {
        id: 'qr-analytics',
        title: 'QR Analytics',
        description: 'View scan trends, country breakdowns, and performance data.',
        icon: '📊',
        path: '/qr-tools/analytics',
        category: 'QR Tools',
        keywords: ['qr', 'analytics', 'data', 'stats', 'performance'],
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

    // Dynamic Converters from Unified Processor
    ...generateDynamicConverters(),

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
    {
        id: 'page-home',
        title: 'Home',
        description: 'Navigate back to the Uvero main landing page.',
        icon: '🏠',
        path: '/',
        category: 'Pages',
        keywords: ['home', 'landing', 'main', 'start', 'index'],
    },
];
