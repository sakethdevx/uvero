/**
 * Tool Registry
 * Central registry for all available tools
 * Makes it easy to add new tools and maintain routing
 */

// Image Utilities

import Watermark from './image/watermark/Watermark';
import watermarkSEO from './image/watermark/seo.json';
import ImageResizer from './image/image-resizer/ImageResizer';
import imageResizerSEO from './image/image-resizer/seo.json';
import ImageCropper from './image/image-cropper/ImageCropper';
import imageCropperSEO from './image/image-cropper/seo.json';

// QR & Security
import QRGenerator from './utility/qr-generator/QRGenerator';
import qrGeneratorSEO from './utility/qr-generator/seo.json';
import PasswordGenerator from './utility/password-generator/PasswordGenerator';
import passwordGeneratorSEO from './utility/password-generator/seo.json';
import HashGenerator from './utility/hash-generator/HashGenerator';
import hashGeneratorSEO from './utility/hash-generator/seo.json';

// Measurements & Time
import UnitConverter from './utility/unit-converter/UnitConverter';
import unitConverterSEO from './utility/unit-converter/seo.json';
import TimeZoneConverter from './utility/timezone-converter/TimeZoneConverter';
import timezoneConverterSEO from './utility/timezone-converter/seo.json';
import LbsToKg from './utility/lbs-to-kg/LbsToKg';
import lbsToKgSEO from './utility/lbs-to-kg/seo.json';
import KgToLbs from './utility/kg-to-lbs/KgToLbs';
import kgToLbsSEO from './utility/kg-to-lbs/seo.json';
import FeetToMeters from './utility/feet-to-meters/FeetToMeters';
import feetToMetersSEO from './utility/feet-to-meters/seo.json';
import PSTToEST from './utility/pst-to-est/PSTToEST';
import pstToEstSEO from './utility/pst-to-est/seo.json';
import CSTToEST from './utility/cst-to-est/CSTToEST';
import cstToEstSEO from './utility/cst-to-est/seo.json';

export const tools = {
    // Image Utilities

    'watermark': {
        id: 'watermark',
        name: 'Add Watermark',
        description: 'Add text or image watermarks to pictures',
        component: Watermark,
        category: 'image-utilities',
        seo: watermarkSEO,
        icon: '©️',
        popular: false,
    },
    'resize-image': {
        id: 'resize-image',
        name: 'Image Resizer',
        description: 'Resize images to any dimensions',
        component: ImageResizer,
        category: 'image-utilities',
        seo: imageResizerSEO,
        icon: '📐',
        popular: true,
    },
    'crop-image': {
        id: 'crop-image',
        name: 'Image Cropper',
        description: 'Crop images to any size or aspect ratio',
        component: ImageCropper,
        category: 'image-utilities',
        seo: imageCropperSEO,
        icon: '✂️',
        popular: false,
    },

    // Security & Codes
    'qr-generator': {
        id: 'qr-generator',
        name: 'QR Code Generator',
        description: 'Generate QR codes for URLs, text, WiFi, vCard, and more',
        component: QRGenerator,
        category: 'security',
        seo: qrGeneratorSEO,
        icon: '🔳',
        popular: true,
    },
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
        name: 'Unit Converter',
        description: 'Convert between length, weight, temperature, and other units',
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
        component: TimeZoneConverter,
        category: 'measurements',
        seo: timezoneConverterSEO,
        icon: '🌍',
        popular: false,
    },
    'lbs-to-kg': {
        id: 'lbs-to-kg',
        name: 'Lbs to Kg',
        description: 'Convert pounds to kilograms',
        component: LbsToKg,
        category: 'measurements',
        seo: lbsToKgSEO,
        icon: '⚖️',
        popular: false,
    },
    'kg-to-lbs': {
        id: 'kg-to-lbs',
        name: 'Kg to Lbs',
        description: 'Convert kilograms to pounds',
        component: KgToLbs,
        category: 'measurements',
        seo: kgToLbsSEO,
        icon: '⚖️',
        popular: false,
    },
    'feet-to-meters': {
        id: 'feet-to-meters',
        name: 'Feet to Meters',
        description: 'Convert feet to meters',
        component: FeetToMeters,
        category: 'measurements',
        seo: feetToMetersSEO,
        icon: '📐',
        popular: false,
    },
    'pst-to-est': {
        id: 'pst-to-est',
        name: 'PST to EST',
        description: 'Convert PST time to EST',
        component: PSTToEST,
        category: 'measurements',
        seo: pstToEstSEO,
        icon: '⏰',
        popular: false,
    },
    'cst-to-est': {
        id: 'cst-to-est',
        name: 'CST to EST',
        description: 'Convert CST time to EST',
        component: CSTToEST,
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
