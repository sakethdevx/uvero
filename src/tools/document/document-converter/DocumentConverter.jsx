import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Document Converter
 * Hub for all document conversion tools
 */
export default function DocumentConverter() {
    const converters = [
        {
            name: 'Word to PDF',
            description: 'Convert Microsoft Word documents to PDF',
            icon: '📝',
            path: '/word-to-pdf',
            formats: 'DOCX → PDF'
        },
        {
            name: 'Excel to PDF',
            description: 'Convert Excel spreadsheets to PDF',
            icon: '📈',
            path: '/excel-to-pdf',
            formats: 'XLSX → PDF'
        },
        {
            name: 'PowerPoint to PDF',
            description: 'Convert PowerPoint presentations to PDF',
            icon: '📊',
            path: '/powerpoint-to-pdf',
            formats: 'PPTX → PDF'
        },
        {
            name: 'HTML to PDF',
            description: 'Convert HTML files to PDF',
            icon: '🌐',
            path: '/html-to-pdf',
            formats: 'HTML → PDF'
        },
        {
            name: 'PDF to Word',
            description: 'Convert PDF to editable Word documents',
            icon: '📝',
            path: '/pdf-to-word',
            formats: 'PDF → DOCX'
        },
        {
            name: 'PDF to Excel',
            description: 'Convert PDF to Excel spreadsheets',
            icon: '📈',
            path: '/pdf-to-excel',
            formats: 'PDF → XLSX'
        },
        {
            name: 'PDF to PowerPoint',
            description: 'Convert PDF to PowerPoint presentations',
            icon: '📊',
            path: '/pdf-to-powerpoint',
            formats: 'PDF → PPTX'
        },
        {
            name: 'EPUB to PDF',
            description: 'Convert EPUB ebooks to PDF',
            icon: '📚',
            path: '/epub-to-pdf',
            formats: 'EPUB → PDF'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="card">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        📄 Document Converter
                    </h1>
                    <p className="text-lg text-gray-600">
                        Convert between various document formats
                    </p>
                </div>

                {/* Converter Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {converters.map((converter, index) => (
                        <Link
                            key={index}
                            to={converter.path}
                            className="group block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{converter.icon}</div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 mb-1">
                                        {converter.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {converter.description}
                                    </p>
                                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-full">
                                        {converter.formats}
                                    </span>
                                </div>
                                <svg
                                    className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <div className="text-4xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            100% Private
                        </h3>
                        <p className="text-sm text-gray-600">
                            All conversions happen in your browser
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Fast Processing
                        </h3>
                        <p className="text-sm text-gray-600">
                            Quick and efficient document conversion
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                        <div className="text-4xl mb-3">🆓</div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Completely Free
                        </h3>
                        <p className="text-sm text-gray-600">
                            No limits, no watermarks, no registration
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        Why Use Document Converter?
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>
                            Our document converter suite provides easy-to-use tools for converting between 
                            popular document formats like PDF, Word, Excel, PowerPoint, and more.
                        </p>
                        <p>
                            All conversions are performed locally in your browser, ensuring your documents 
                            remain private and secure. No files are uploaded to any server.
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-3 ml-4">
                            <li>Convert Office documents to PDF</li>
                            <li>Convert PDF back to editable formats</li>
                            <li>Convert ebooks between formats</li>
                            <li>Preserve formatting and layout</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
