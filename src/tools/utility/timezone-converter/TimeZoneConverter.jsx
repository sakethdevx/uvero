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
            setTimeout(() => handleConvert(), 0);
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
        <div className="max-w-3xl mx-auto">
            <div className="card">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🌍 Time Zone Converter
                    </h1>
                    <p className="text-gray-600">
                        Convert time between different time zones around the world
                    </p>
                </div>

                {/* Current Time Display */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1 truncate">
                            {timeZones.find(tz => tz.value === fromZone)?.label}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">{currentFromTime}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1 truncate">
                            {timeZones.find(tz => tz.value === toZone)?.label}
                        </p>
                        <p className="text-2xl font-bold text-green-600">{currentToTime}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Date Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={inputDate}
                            onChange={(e) => setInputDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* From Zone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Time Zone
                        </label>
                        <select
                            value={fromZone}
                            onChange={(e) => setFromZone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {timeZones.map(tz => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label} ({tz.offset})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                        </label>
                        <input
                            type="time"
                            value={inputTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={handleSwapZones}
                            variant="secondary"
                            className="flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            Swap Time Zones
                        </Button>
                    </div>

                    {/* To Zone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To Time Zone
                        </label>
                        <select
                            value={toZone}
                            onChange={(e) => setToZone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {timeZones.map(tz => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label} ({tz.offset})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Result Section */}
                    {result && (
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Converted Time</p>
                                <p className="text-4xl font-bold text-primary-600">
                                    {result}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    {inputTime} ({timeZones.find(tz => tz.value === fromZone)?.label}) 
                                    <br />= {result} ({timeZones.find(tz => tz.value === toZone)?.label})
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleConvert}
                            disabled={!inputTime}
                            variant="primary"
                            className="flex-1"
                        >
                            Convert
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="secondary"
                        >
                            Reset
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>Supports 17 major time zones worldwide</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>Automatically accounts for Daylight Saving Time</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>Real-time clock display for both time zones</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>Instant conversion as you type</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
