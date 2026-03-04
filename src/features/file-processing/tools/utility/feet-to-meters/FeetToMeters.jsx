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
        <div className="max-w-2xl mx-auto">
            <div className="card">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📏 Feet to Meters Converter
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Convert feet (ft) to meters (m) instantly
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Input Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Feet (ft)
                        </label>
                        <input
                            type="number"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Enter length in feet"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            step="0.01"
                        />
                    </div>

                    {/* Result Section */}
                    {result && (
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Result</p>
                                <p className="text-4xl font-bold text-primary-600">
                                    {result} m
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {inputValue} ft = {result} meters
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleConvert}
                            disabled={!inputValue || isNaN(inputValue)}
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

                    {/* Quick Reference */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Reference</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">1 ft =</span>
                                <span className="font-medium">0.3048 m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">10 ft =</span>
                                <span className="font-medium">3.048 m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">50 ft =</span>
                                <span className="font-medium">15.24 m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">100 ft =</span>
                                <span className="font-medium">30.48 m</span>
                            </div>
                        </div>
                    </div>

                    {/* Formula */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Formula</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                meters = feet × 0.3048
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
