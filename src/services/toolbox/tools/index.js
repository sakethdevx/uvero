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
import timezoneConverterSEO from './utility/timezone-converter/seo.json';
import lbsToKgSEO from './utility/lbs-to-kg/seo.json';
import kgToLbsSEO from './utility/kg-to-lbs/seo.json';
import feetToMetersSEO from './utility/feet-to-meters/seo.json';
import pstToEstSEO from './utility/pst-to-est/seo.json';
import cstToEstSEO from './utility/cst-to-est/seo.json';

export const tools = {
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
    },
    'timezone-converter': {
        id: 'timezone-converter',
        name: 'Time Zone Converter',
        description: 'Convert times across different time zones',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "timezone" }),
        category: 'measurements',
        seo: timezoneConverterSEO,
        icon: '🌍',
        popular: false,
    },
    'lbs-to-kg': {
        id: 'lbs-to-kg',
        name: 'Lbs to Kg',
        description: 'Convert pounds to kilograms',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "weight", initialFrom: "lbs", initialTo: "kg" }),
        category: 'measurements',
        seo: lbsToKgSEO,
        icon: '⚖️',
        popular: false,
    },
    'kg-to-lbs': {
        id: 'kg-to-lbs',
        name: 'Kg to Lbs',
        description: 'Convert kilograms to pounds',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "weight", initialFrom: "kg", initialTo: "lbs" }),
        category: 'measurements',
        seo: kgToLbsSEO,
        icon: '⚖️',
        popular: false,
    },
    'feet-to-meters': {
        id: 'feet-to-meters',
        name: 'Feet to Meters',
        description: 'Convert feet to meters',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "length", initialFrom: "ft", initialTo: "m" }),
        category: 'measurements',
        seo: feetToMetersSEO,
        icon: '📐',
        popular: false,
    },
    'pst-to-est': {
        id: 'pst-to-est',
        name: 'PST to EST',
        description: 'Convert PST time to EST',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "timezone", initialFrom: "America/Los_Angeles", initialTo: "America/New_York" }),
        category: 'measurements',
        seo: pstToEstSEO,
        icon: '⏰',
        popular: false,
    },
    'cst-to-est': {
        id: 'cst-to-est',
        name: 'CST to EST',
        description: 'Convert CST time to EST',
        component: (props) => React.createElement(UnitConverter, { ...props, initialCategory: "timezone", initialFrom: "America/Chicago", initialTo: "America/New_York" }),
        category: 'measurements',
        seo: cstToEstSEO,
        icon: '⏰',
        popular: false,
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
