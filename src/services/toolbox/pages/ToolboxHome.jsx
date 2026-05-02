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

            <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8">
                {/* Refined AI Hero Section */}
                <section className="text-center mb-12 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-fade-in">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Private Browser Intelligence
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6 leading-tight">
                        <span className="text-gray-900 dark:text-white">Smart Processing.</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
                            Entirely in your browser.
                        </span>
                    </h1>
                    
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Uvero Toolbox uses <span className="text-indigo-600 dark:text-indigo-400">WebAssembly</span> to process your files 
                        locally. No data ever leaves your computer. Fast. Secure. Seamless.
                    </p>
                    
                    {/* AI Magic Decoration */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none -z-10" />
                </section>

                {/* Unified Converter */}
                <UnifiedConverter />

                {/* Other Tools Hub */}
                <OtherToolsHub />
            </div>
        </div>
    );
}
