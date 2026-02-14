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
        <div className="max-w-2xl mx-auto">
            <div className="card">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🌍 PST to EST Converter
                    </h1>
                    <p className="text-gray-600">
                        Convert Pacific Standard Time to Eastern Standard Time
                    </p>
                </div>

                {/* Current Time Display */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Current PST</p>
                        <p className="text-2xl font-bold text-blue-600">{currentPST}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Current EST</p>
                        <p className="text-2xl font-bold text-green-600">{currentEST}</p>
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

                    {/* Time Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PST Time
                        </label>
                        <input
                            type="time"
                            value={inputTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Result Section */}
                    {result && (
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">EST Time</p>
                                <p className="text-4xl font-bold text-primary-600">
                                    {result}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    {inputTime} PST = {result} EST
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
                        <h3 className="font-semibold text-gray-900 mb-3">Time Zone Information</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>PST (Pacific Standard Time) is UTC-8</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>EST (Eastern Standard Time) is UTC-5</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>EST is 3 hours ahead of PST</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span>During daylight saving time, PDT (UTC-7) and EDT (UTC-4) are used</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">⚠</span>
                                <span className="text-orange-600">Note: This uses a fixed 3-hour offset. For DST-aware conversion, use the Time Zone Converter tool.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
