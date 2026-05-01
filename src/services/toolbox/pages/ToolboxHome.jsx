import UnifiedConverter from './UnifiedConverter';
import OtherToolsHub from './OtherToolsHub';

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

                {/* Other Tools Hub */}
                <OtherToolsHub />
            </div>
        </div>
    );
}
