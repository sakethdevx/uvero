import { useState, useEffect } from 'react';
import Button from '../../../shared/Button';

/**
 * PST to EST Converter
 * Convert Pacific Standard Time to Eastern Standard Time
 */
export default function PSTToEST() {
    const [inputTime, setInputTime] = useState('');
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [result, setResult] = useState('');
    const [currentPST, setCurrentPST] = useState('');
    const [currentEST, setCurrentEST] = useState('');

    useEffect(() => {
        // Update current times every second
        const interval = setInterval(() => {
            const now = new Date();
            
            // PST is UTC-8 (or UTC-7 during PDT)
            const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
            setCurrentPST(pstTime.toLocaleTimeString('en-US', { hour12: false }));
            
            // EST is UTC-5 (or UTC-4 during EDT)
            const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            setCurrentEST(estTime.toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleConvert = () => {
        if (!inputTime) {
            setResult('');
            return;
        }

        try {
            // Parse the input time
            const [hours, minutes] = inputTime.split(':').map(Number);
            
            // Create a date object in PST timezone
            const pstDate = new Date(inputDate);
            pstDate.setHours(hours, minutes, 0, 0);
            
            // PST is 3 hours behind EST
            const estDate = new Date(pstDate.getTime() + (3 * 60 * 60 * 1000));
            
            const estHours = String(estDate.getHours()).padStart(2, '0');
            const estMinutes = String(estDate.getMinutes()).padStart(2, '0');
            
            setResult(`${estHours}:${estMinutes}`);
        } catch (err) {
            setResult('Invalid time format');
            console.error('Conversion error:', err);
        }
    };

    const handleInputChange = (e) => {
        const time = e.target.value;
        setInputTime(time);
        
        // Auto-convert as user types
        if (time && time.includes(':')) {
            try {
                const [hours, minutes] = time.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const pstDate = new Date(inputDate);
                    pstDate.setHours(hours, minutes, 0, 0);
                    const estDate = new Date(pstDate.getTime() + (3 * 60 * 60 * 1000));
                    const estHours = String(estDate.getHours()).padStart(2, '0');
                    const estMinutes = String(estDate.getMinutes()).padStart(2, '0');
                    setResult(`${estHours}:${estMinutes}`);
                }
            } catch (err) {
                setResult('');
                console.error('Conversion error:', err);
            }
        }
    };

    const handleReset = () => {
        setInputTime('');
        setInputDate(new Date().toISOString().split('T')[0]);
        setResult('');
    };

    return (
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-8">
                {/* Current Time Display */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="glass-subtle p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2 truncate">
                            Current PST (Pacific)
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                            {currentPST}
                        </div>
                    </div>
                    <div className="glass-subtle p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 truncate">
                            Current EST (Eastern)
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                            {currentEST}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        {/* Date & Time Selection */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                    Base Date
                                </label>
                                <input
                                    type="date"
                                    value={inputDate}
                                    onChange={(e) => setInputDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                    PST Time
                                </label>
                                <input
                                    type="time"
                                    value={inputTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Conversion Controls */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleConvert}
                                disabled={!inputTime}
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
                        {/* Result Display */}
                        {result ? (
                            <div className="glass-subtle p-6 rounded-2xl bg-indigo-500/[0.03] border-indigo-500/20 flex flex-col items-center justify-center text-center animate-resultReveal">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Converted EST Result</p>
                                <div className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter mb-4">
                                    {result}
                                </div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {inputTime} PST = {result} EST
                                </p>
                            </div>
                        ) : (
                            <div className="glass-subtle p-6 rounded-2xl border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Awaiting Input</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Time Zone Information */}
                <div className="glass-subtle p-5 rounded-2xl bg-orange-500/[0.02] border-orange-500/10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-4">Time Zone Metadata</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">PST (Pacific Standard Time) is UTC-8</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">EST (Eastern Standard Time) is UTC-5</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-orange-500/10 text-[10px] font-mono text-orange-600/80 dark:text-orange-400/80 leading-relaxed italic">
                            Note: This tool uses a fixed 3-hour offset. For DST-aware conversions, please utilize the primary Time Zone Converter engine.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
