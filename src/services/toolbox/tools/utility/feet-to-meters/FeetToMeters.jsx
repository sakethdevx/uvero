import { useState } from 'react';
import Button from '../../../shared/Button';

/**
 * Feet to Meters Converter
 * Convert feet to meters
 */
export default function FeetToMeters() {
    const [inputValue, setInputValue] = useState('');
    const [result, setResult] = useState('');

    const handleConvert = () => {
        if (!inputValue || isNaN(inputValue)) {
            setResult('');
            return;
        }

        const feet = parseFloat(inputValue);
        const meters = feet * 0.3048;
        setResult(meters.toFixed(4));
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        // Auto-convert as user types
        if (e.target.value && !isNaN(e.target.value)) {
            const feet = parseFloat(e.target.value);
            const meters = feet * 0.3048;
            setResult(meters.toFixed(4));
        } else {
            setResult('');
        }
    };

    const handleReset = () => {
        setInputValue('');
        setResult('');
    };

    return (
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-8">
                {/* Input Section */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">
                        Source Length (Feet)
                    </label>
                    <div className="relative group/input">
                        <input
                            type="number"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Enter length in ft..."
                            className="w-full px-5 py-5 pr-16 text-lg font-mono bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none transition-all duration-300 shadow-sm dark:shadow-none"
                            step="0.01"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest pointer-events-none">
                            FT
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        {result ? (
                            <div className="glass-subtle p-8 rounded-2xl bg-indigo-500/[0.03] border-indigo-500/20 flex flex-col items-center justify-center text-center animate-resultReveal">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Converted Length</p>
                                <div className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter mb-4">
                                    {result} <span className="text-2xl text-gray-400">m</span>
                                </div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {inputValue} ft = {result} meters
                                </p>
                            </div>
                        ) : (
                            <div className="glass-subtle p-8 rounded-2xl border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Awaiting Input</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleConvert}
                                disabled={!inputValue || isNaN(inputValue)}
                                className="flex-1 btn-accent py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                Execute Conversion
                            </button>
                            <button
                                onClick={handleReset}
                                className="suggestion-chip !opacity-100 !animate-none px-6 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-500"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Quick Reference */}
                        <div className="glass-subtle p-5 rounded-2xl space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Quick Reference</h3>
                            <div className="space-y-3">
                                {[
                                    { ft: '1', m: '0.3048' },
                                    { ft: '10', m: '3.0480' },
                                    { ft: '50', m: '15.240' },
                                    { ft: '100', m: '30.480' }
                                ].map((item) => (
                                    <div key={item.ft} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-500 dark:text-gray-400">{item.ft} ft</span>
                                        <span className="w-4 h-px bg-gray-100 dark:bg-white/5"></span>
                                        <span className="font-black text-gray-900 dark:text-white tabular-nums">{item.m} m</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Formula */}
                        <div className="glass-subtle p-5 rounded-2xl bg-blue-500/[0.02] border-blue-500/10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-3">Conversion Logic</h3>
                            <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-blue-500/10 text-[10px] font-mono text-gray-600 dark:text-gray-400 leading-relaxed">
                                m = ft × 0.3048<br/>
                                (exact conversion factor)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
