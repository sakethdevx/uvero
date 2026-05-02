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

            <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-20 sm:px-6 lg:px-8">
                {/* Enhanced Hero Section */}
                <section className="text-center mb-16 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        Next-Gen Browser Processing
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 dark:from-white dark:via-primary-400 dark:to-blue-400">
                        Uvero <span className="relative inline-block">
                            Toolbox
                            <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary-500/30 rounded-full blur-sm" />
                        </span>
                    </h1>
                    
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Convert images, documents, and media with <span className="font-bold text-gray-900 dark:text-white">WebAssembly</span>. 
                        Fast, private, and processing 100% in your browser.
                    </p>
                    
                    {/* Decorative element */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-primary-500/5 dark:bg-primary-500/10 blur-[120px] -z-10 rounded-full" />
                </section>

                {/* Unified Converter */}
                <UnifiedConverter />

                {/* Other Tools Hub */}
                <OtherToolsHub />
            </div>
        </div>
    );
}
