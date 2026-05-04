import { useState, useEffect } from 'react';
import Button from '../../../shared/Button';

/**
 * Time Zone Converter
 * Convert time between different time zones
 */
export default function TimeZoneConverter() {
    const [inputTime, setInputTime] = useState('');
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [fromZone, setFromZone] = useState('America/New_York');
    const [toZone, setToZone] = useState('America/Los_Angeles');
    const [result, setResult] = useState('');
    const [currentFromTime, setCurrentFromTime] = useState('');
    const [currentToTime, setCurrentToTime] = useState('');

    const timeZones = [
        { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
        { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
        { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
        { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/-8' },
        { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: 'UTC-10' },
        { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
        { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
        { value: 'Europe/Athens', label: 'Eastern European Time (EET)', offset: 'UTC+2/+3' },
        { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: 'UTC+3' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
        { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
        { value: 'Asia/Shanghai', label: 'China (CST)', offset: 'UTC+8' },
        { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: 'UTC+9' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 'UTC+10/+11' },
        { value: 'Pacific/Auckland', label: 'New Zealand (NZST/NZDT)', offset: 'UTC+12/+13' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'UTC+0' }
    ];

    useEffect(() => {
        // Update current times every second
        const interval = setInterval(() => {
            const now = new Date();
            
            const fromTime = new Date(now.toLocaleString('en-US', { timeZone: fromZone }));
            setCurrentFromTime(fromTime.toLocaleTimeString('en-US', { hour12: false }));
            
            const toTime = new Date(now.toLocaleString('en-US', { timeZone: toZone }));
            setCurrentToTime(toTime.toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);

        return () => clearInterval(interval);
    }, [fromZone, toZone]);

    const handleConvert = () => {
        if (!inputTime) {
            setResult('');
            return;
        }

        try {
            const dateTimeString = `${inputDate}T${inputTime}:00`;
            
            // Create date in the source timezone
            const sourceDate = new Date(dateTimeString);
            
            // Calculate the offset difference
            const sourceOffset = getTimezoneOffset(sourceDate, fromZone);
            const targetOffset = getTimezoneOffset(sourceDate, toZone);
            const offsetDiff = targetOffset - sourceOffset;
            
            // Apply offset to get target time
            const targetDate = new Date(sourceDate.getTime() + offsetDiff);
            const targetHours = String(targetDate.getHours()).padStart(2, '0');
            const targetMinutes = String(targetDate.getMinutes()).padStart(2, '0');
            
            setResult(`${targetHours}:${targetMinutes}`);
        } catch (error) {
            console.error('Conversion error:', error);
            setResult('Invalid time format');
        }
    };

    const getTimezoneOffset = (date, timezone) => {
        // Get UTC time
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        // Get time in target timezone
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        // Return offset in milliseconds
        return tzDate.getTime() - utcDate.getTime();
    };

    const handleInputChange = (e) => {
        const time = e.target.value;
        setInputTime(time);
        
        // Auto-convert as user types
        if (time && time.includes(':')) {
            handleConvert();
        }
    };

    const handleReset = () => {
        setInputTime('');
        setInputDate(new Date().toISOString().split('T')[0]);
        setResult('');
    };

    const handleSwapZones = () => {
        const temp = fromZone;
        setFromZone(toZone);
        setToZone(temp);
        if (inputTime) {
            // Swap the result back to input
            setInputTime(result);
            setTimeout(() => handleConvert(), 0);
        }
    };

    return (
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-8">
                {/* Current Time Display */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="glass-subtle p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 truncate">
                            {timeZones.find(tz => tz.value === fromZone)?.label}
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                            {currentFromTime}
                        </div>
                    </div>
                    <div className="glass-subtle p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2 truncate">
                            {timeZones.find(tz => tz.value === toZone)?.label}
                        </div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                            {currentToTime}
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
                                    Base Time
                                </label>
                                <input
                                    type="time"
                                    value={inputTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Zone Selection */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                    Origin Time Zone
                                </label>
                                <select
                                    value={fromZone}
                                    onChange={(e) => setFromZone(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {timeZones.map(tz => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label} ({tz.offset})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center -my-2 relative z-10">
                                <button
                                    onClick={handleSwapZones}
                                    className="suggestion-chip !opacity-100 !animate-none p-3 rounded-full hover:rotate-180 transition-transform duration-500 group/swap"
                                    title="Swap Zones"
                                >
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                    Destination Time Zone
                                </label>
                                <select
                                    value={toZone}
                                    onChange={(e) => setToZone(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {timeZones.map(tz => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label} ({tz.offset})
                                        </option>
                                    ))}
                                </select>
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
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Result Display */}
                        {result ? (
                            <div className="glass-subtle p-6 rounded-2xl bg-indigo-500/[0.03] border-indigo-500/20 flex flex-col items-center justify-center text-center animate-resultReveal">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Converted Result</p>
                                <div className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter mb-4">
                                    {result}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {inputTime} @ {fromZone.split('/').pop().replace('_', ' ')}
                                    </p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                        → {result} @ {toZone.split('/').pop().replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-subtle p-6 rounded-2xl border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Awaiting Input</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features / Info */}
                <div className="glass-subtle p-5 rounded-2xl grid sm:grid-cols-3 gap-6">
                    {[
                        { icon: '🌍', label: 'Global Coverage', desc: '17 major time zones supported' },
                        { icon: '⏰', label: 'DST Aware', desc: 'Automatic daylight saving adjustments' },
                        { icon: '⚡', label: 'Live Engine', desc: 'Real-time clock synchronization' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-xl shadow-sm border border-gray-100 dark:border-white/5">
                                {item.icon}
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
