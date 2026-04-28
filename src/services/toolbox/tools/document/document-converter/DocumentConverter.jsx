import { Link } from 'react-router-dom';
import { useMode } from '../../../context/ModeContext';
import { getToolById } from '../../index';
import {
    getDocumentConverterTools,
    getToolAvailabilityBadge,
} from '../../../core/toolMetadata';

/**
 * Document Converter
 * Hub for all document conversion tools
 */
export default function DocumentConverter() {
    const { isOnlineMode } = useMode();
    const mode = isOnlineMode ? 'online' : 'offline';
    const converters = getDocumentConverterTools(getToolById, mode);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="card">

                {/* Converter Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {converters.map((converter) => {
                        const availabilityBadge = getToolAvailabilityBadge(converter);

                        return (
                        <Link
                            key={converter.id}
                            to={`/${converter.id}`}
                            className="group block p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{converter.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600">
                                            {converter.name}
                                        </h3>
                                        {availabilityBadge && (
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                {availabilityBadge.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        {converter.description}
                                    </p>
                                    {converter.availabilityNote && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            {converter.availabilityNote}
                                        </p>
                                    )}
                                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-mono rounded-full">
                                        {converter.formatLabel}
                                    </span>
                                </div>
                                <svg
                                    className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    )})}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 dark:from-gray-900 to-blue-100 rounded-xl">
                        <div className="text-4xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Mixed Runtime
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Includes offline browser tools and deployment-backed online flows
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 dark:from-gray-900 to-green-100 rounded-xl">
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Fast Processing
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Quick and efficient document conversion
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 dark:from-gray-900 to-purple-100 rounded-xl">
                        <div className="text-4xl mb-3">🆓</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Completely Free
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            No limits, no watermarks, no registration
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Why Use Document Converter?
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <p>
                            Our document converter suite provides easy-to-use tools for converting between 
                            popular document formats like PDF, Word, Excel, PowerPoint, and more.
                        </p>
                        <p>
                            Most document tools run locally in your browser, while a few specialized conversions
                            can use deployment-backed online runtimes when available.
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
