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
                {/* AI-Inspired Hero Section */}
                <section className="text-center mb-16 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in shadow-sm shadow-indigo-500/20">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Intelligence at the Edge
                    </div>
                    
                    <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                        <span className="block text-gray-900 dark:text-white">The Future of</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 animate-gradient-x py-2">
                            Digital Media
                        </span>
                    </h1>
                    
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Uvero Toolbox leverages <span className="text-indigo-600 dark:text-indigo-400">Neural-WASM</span> architecture to provide 
                        lightning-fast, private file intelligence directly in your browser.
                    </p>
                    
                    {/* AI Magic Decoration */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />
                    
                    <div className="mt-12 flex items-center justify-center gap-3">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">Trusted by Creators</div>
                            <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(i => (
                                    <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Unified Converter */}
                <UnifiedConverter />

                {/* Other Tools Hub */}
                <OtherToolsHub />
            </div>
        </div>
    );
}
