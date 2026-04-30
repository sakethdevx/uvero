import { useState } from 'react';
import { Link } from 'react-router-dom';
import UnifiedConverter from './UnifiedConverter';

// Define the non-conversion tools we keep
const OTHER_TOOLS = [
    {
        id: 'background-remover',
        name: 'Background Remover',
        description: 'Remove backgrounds from images automatically',
        icon: '🎨',
        gradient: 'from-rose-500 to-pink-600',
        link: '/remove-background'
    },
    {
        id: 'image-resizer',
        name: 'Image Resizer',
        description: 'Resize images to any dimensions',
        icon: '📐',
        gradient: 'from-sky-500 to-blue-600',
        link: '/resize-image'
    },
    {
        id: 'image-cropper',
        name: 'Image Cropper',
        description: 'Crop images to any size or aspect ratio',
        icon: '✂️',
        gradient: 'from-emerald-500 to-green-600',
        link: '/crop-image'
    },
    {
        id: 'qr-generator',
        name: 'QR Code Generator',
        description: 'Generate QR codes for any purpose',
        icon: '🔳',
        gradient: 'from-violet-500 to-purple-600',
        link: '/qr-generator'
    },
    {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate strong, random passwords',
        icon: '🔐',
        gradient: 'from-amber-500 to-orange-600',
        link: '/password-generator'
    },
    {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate MD5, SHA-1, SHA-256 hashes',
        icon: '🔒',
        gradient: 'from-cyan-500 to-teal-600',
        link: '/hash-generator'
    },
    {
        id: 'unit-converter',
        name: 'Unit Converter',
        description: 'Convert between length, weight, temperature, etc.',
        icon: '📏',
        gradient: 'from-indigo-500 to-blue-600',
        link: '/unit-converter'
    },
    {
        id: 'timezone-converter',
        name: 'Time Zone Converter',
        description: 'Convert times across different time zones',
        icon: '🌍',
        gradient: 'from-orange-500 to-red-600',
        link: '/timezone-converter'
    },
    {
        id: 'lbs-to-kg',
        name: 'Lbs to Kg',
        description: 'Convert pounds to kilograms',
        icon: '⚖️',
        gradient: 'from-gray-500 to-gray-700',
        link: '/lbs-to-kg'
    },
    {
        id: 'kg-to-lbs',
        name: 'Kg to Lbs',
        description: 'Convert kilograms to pounds',
        icon: '⚖️',
        gradient: 'from-gray-500 to-gray-700',
        link: '/kg-to-lbs'
    },
    {
        id: 'feet-to-meters',
        name: 'Feet to Meters',
        description: 'Convert feet to meters',
        icon: '📐',
        gradient: 'from-gray-500 to-gray-700',
        link: '/feet-to-meters'
    },
    {
        id: 'pst-to-est',
        name: 'PST to EST',
        description: 'Convert PST time to EST',
        icon: '⏰',
        gradient: 'from-gray-500 to-gray-700',
        link: '/pst-to-est'
    },
    {
        id: 'cst-to-est',
        name: 'CST to EST',
        description: 'Convert CST time to EST',
        icon: '⏰',
        gradient: 'from-gray-500 to-gray-700',
        link: '/cst-to-est'
    }
];

export default function ToolboxHome() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background decorations */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[-12rem] top-16 h-96 w-96 rounded-full bg-primary-500/12 blur-3xl" />
                <div className="absolute right-[-10rem] top-8 h-80 w-80 rounded-full bg-blue-500/12 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                        Uvero <span className="text-primary-600 dark:text-primary-400">Toolbox</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Convert images, documents, and more with WebAssembly. Fast, private, and entirely in your browser.
                    </p>
                </section>

                {/* Unified Converter */}
                <UnifiedConverter />

                {/* Other Tools Grid */}
                <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Other Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {OTHER_TOOLS.map((tool) => (
                            <Link
                                key={tool.id}
                                to={tool.link}
                                className={`rounded-2xl border border-gray-200/80 bg-gradient-to-br ${tool.gradient} p-6 shadow-lg hover:shadow-xl transition-all group`}
                            >
                                <div className="text-4xl mb-4">{tool.icon}</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:underline">
                                    {tool.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {tool.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
