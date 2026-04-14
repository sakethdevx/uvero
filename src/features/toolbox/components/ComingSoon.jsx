import React from 'react';

const ComingSoon = ({ toolName, icon = '🚀' }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-6 shadow-lg">
                        <span className="text-4xl">{icon}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {toolName}
                    </h1>
                    <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold mb-6">
                        🚀 Coming Soon
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="text-center space-y-6">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                We're Working on This Tool
                            </h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                This feature is currently under development. We're working hard to bring you the best experience with powerful conversion capabilities and privacy-first design.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 pt-6">
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">100% Private</h3>
                                <p className="text-sm text-gray-600">Your files will never leave your device</p>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Lightning Fast</h3>
                                <p className="text-sm text-gray-600">Instant processing in your browser</p>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Free Forever</h3>
                                <p className="text-sm text-gray-600">No subscriptions or hidden fees</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-200">
                            <p className="text-gray-600 mb-4">
                                In the meantime, check out our other tools:
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <a href="/compress-image" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                    Image Compressor
                                </a>
                                <a href="/compress-pdf" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                    PDF Compressor
                                </a>
                                <a href="/qr-generator" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                    QR Generator
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-gray-500 text-sm">
                    <p>Want to be notified when this tool is ready? Follow us for updates!</p>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
