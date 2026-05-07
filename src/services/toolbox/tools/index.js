/**
 * Tool Registry
 * Central registry for all available tools
 * Makes it easy to add new tools and maintain routing
 */

import React from 'react';
// Security & Codes
import PasswordGenerator from './utility/password-generator/PasswordGenerator';
import passwordGeneratorSEO from './utility/password-generator/seo.json';
import HashGenerator from './utility/hash-generator/HashGenerator';
import hashGeneratorSEO from './utility/hash-generator/seo.json';

// Measurements & Time
import UnitConverter from './utility/unit-converter/UnitConverter';
import unitConverterSEO from './utility/unit-converter/seo.json';

// Document Tools
import MergePdfTool, { metadata as mergePdfMetadata } from './document/merge-pdf/index.jsx';

export const tools = {
    // Document Tools
    'merge-pdf': {
        ...mergePdfMetadata,
        description: 'Combine multiple PDF files into a single document easily.',
        component: MergePdfTool,
        popular: true,
        seo: {
            title: "Merge PDF | Uvero",
            description: "Combine multiple PDF files into one quickly and securely in your browser."
        }
    },

    // Image Utilities
    // Image Utilities


    // Security & Codes
    'password-generator': {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate strong, random passwords with customizable options',
        component: PasswordGenerator,
        category: 'security',
        seo: passwordGeneratorSEO,
        icon: '🔐',
        popular: true,
    },
    'hash-generator': {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate MD5, SHA-1, SHA-256, and other hashes',
        component: HashGenerator,
        category: 'security',
        seo: hashGeneratorSEO,
        icon: '🔒',
        popular: false,
    },

    // Measurements & Time
    'unit-converter': {
        id: 'unit-converter',
        name: 'Universal Converter',
        description: 'Convert between length, weight, temperature, timezones, and other units',
        component: UnitConverter,
        category: 'measurements',
        seo: unitConverterSEO,
        icon: '📏',
        popular: true,
    }
};

const enhanceTool = (tool) => tool;

export const getToolById = (id) => {
    const tool = tools[id];
    return enhanceTool(tool) || null;
};

export function getToolsByCategory(categoryId) {
    return Object.values(tools).filter((tool) => tool.category === categoryId);
}

export function getPopularTools(limit = 3) {
    const popular = Object.values(tools).filter((tool) => tool.popular);
    return popular.slice(0, limit);
}
