import { useState, useEffect } from 'react';
import Button from '../../../shared/Button';

const UnitConverter = () => {
    const [category, setCategory] = useState('weight');
    const [fromUnit, setFromUnit] = useState('kg');
    const [toUnit, setToUnit] = useState('lbs');
    const [inputValue, setInputValue] = useState('');
    const [result, setResult] = useState('');

    const conversionData = {
        weight: {
            name: 'Weight',
            icon: '⚖️',
            units: {
                kg: { name: 'Kilogram (kg)', toBase: 1 },
                lbs: { name: 'Pound (lbs)', toBase: 0.453592 },
                g: { name: 'Gram (g)', toBase: 0.001 },
                oz: { name: 'Ounce (oz)', toBase: 0.0283495 },
                ton: { name: 'Metric Ton (ton)', toBase: 1000 },
                stone: { name: 'Stone (st)', toBase: 6.35029 }
            }
        },
        length: {
            name: 'Length',
            icon: '📏',
            units: {
                m: { name: 'Meter (m)', toBase: 1 },
                km: { name: 'Kilometer (km)', toBase: 1000 },
                cm: { name: 'Centimeter (cm)', toBase: 0.01 },
                mm: { name: 'Millimeter (mm)', toBase: 0.001 },
                ft: { name: 'Foot (ft)', toBase: 0.3048 },
                in: { name: 'Inch (in)', toBase: 0.0254 },
                yd: { name: 'Yard (yd)', toBase: 0.9144 },
                mi: { name: 'Mile (mi)', toBase: 1609.34 }
            }
        },
        temperature: {
            name: 'Temperature',
            icon: '🌡️',
            units: {
                c: { name: 'Celsius (°C)', toBase: null },
                f: { name: 'Fahrenheit (°F)', toBase: null },
                k: { name: 'Kelvin (K)', toBase: null }
            }
        },
        volume: {
            name: 'Volume',
            icon: '🧪',
            units: {
                l: { name: 'Liter (L)', toBase: 1 },
                ml: { name: 'Milliliter (mL)', toBase: 0.001 },
                gal: { name: 'Gallon (gal)', toBase: 3.78541 },
                qt: { name: 'Quart (qt)', toBase: 0.946353 },
                pt: { name: 'Pint (pt)', toBase: 0.473176 },
                cup: { name: 'Cup (cup)', toBase: 0.236588 },
                floz: { name: 'Fluid Ounce (fl oz)', toBase: 0.0295735 },
                m3: { name: 'Cubic Meter (m³)', toBase: 1000 }
            }
        },
        area: {
            name: 'Area',
            icon: '📐',
            units: {
                m2: { name: 'Square Meter (m²)', toBase: 1 },
                km2: { name: 'Square Kilometer (km²)', toBase: 1000000 },
                cm2: { name: 'Square Centimeter (cm²)', toBase: 0.0001 },
                ft2: { name: 'Square Foot (ft²)', toBase: 0.092903 },
                in2: { name: 'Square Inch (in²)', toBase: 0.00064516 },
                acre: { name: 'Acre', toBase: 4046.86 },
                hectare: { name: 'Hectare (ha)', toBase: 10000 }
            }
        },
        speed: {
            name: 'Speed',
            icon: '⚡',
            units: {
                mps: { name: 'Meters per Second (m/s)', toBase: 1 },
                kph: { name: 'Kilometers per Hour (km/h)', toBase: 0.277778 },
                mph: { name: 'Miles per Hour (mph)', toBase: 0.44704 },
                fps: { name: 'Feet per Second (ft/s)', toBase: 0.3048 },
                knot: { name: 'Knot (knot)', toBase: 0.514444 }
            }
        },
        time: {
            name: 'Time',
            icon: '⏱️',
            units: {
                s: { name: 'Second (s)', toBase: 1 },
                min: { name: 'Minute (min)', toBase: 60 },
                hr: { name: 'Hour (hr)', toBase: 3600 },
                day: { name: 'Day (day)', toBase: 86400 },
                week: { name: 'Week (week)', toBase: 604800 },
                month: { name: 'Month (month)', toBase: 2629746 }, // Average month (365.25 days / 12)
                year: { name: 'Year (year)', toBase: 31557600 } // Average year (365.25 days)
            }
        }
    };

    const convertTemperature = (value, from, to) => {
        let celsius;
        
        // Convert to Celsius first
        switch (from) {
            case 'c':
                celsius = value;
                break;
            case 'f':
                celsius = (value - 32) * 5/9;
                break;
            case 'k':
                celsius = value - 273.15;
                break;
            default:
                return 0;
        }

        // Convert from Celsius to target
        switch (to) {
            case 'c':
                return celsius;
            case 'f':
                return (celsius * 9/5) + 32;
            case 'k':
                return celsius + 273.15;
            default:
                return 0;
        }
    };

    const convert = (value, from, to, cat) => {
        if (!value || isNaN(value)) return '';

        const numValue = parseFloat(value);

        if (cat === 'temperature') {
            return convertTemperature(numValue, from, to);
        }

        // For other categories, use the base unit conversion
        const fromFactor = conversionData[cat].units[from].toBase;
        const toFactor = conversionData[cat].units[to].toBase;

        const baseValue = numValue * fromFactor;
        const convertedValue = baseValue / toFactor;

        return convertedValue;
    };

    useEffect(() => {
        if (inputValue && !isNaN(inputValue)) {
            const converted = convert(inputValue, fromUnit, toUnit, category);
            // Format the result: remove unnecessary trailing zeros but keep significant digits
            const formatted = converted.toFixed(6).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
            setResult(formatted);
        } else {
            setResult('');
        }
    }, [inputValue, fromUnit, toUnit, category]);

    const handleCategoryChange = (newCategory) => {
        setCategory(newCategory);
        const units = Object.keys(conversionData[newCategory].units);
        setFromUnit(units[0]);
        setToUnit(units[1] || units[0]);
        setInputValue('');
        setResult('');
    };

    const handleSwapUnits = () => {
        const temp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(temp);
        if (result) {
            setInputValue(result);
        }
    };

    const quickConversions = [
        { category: 'weight', from: 'lbs', to: 'kg', label: 'Lbs to Kg' },
        { category: 'weight', from: 'kg', to: 'lbs', label: 'Kg to Lbs' },
        { category: 'length', from: 'ft', to: 'm', label: 'Feet to Meters' },
        { category: 'length', from: 'm', to: 'ft', label: 'Meters to Feet' },
        { category: 'temperature', from: 'c', to: 'f', label: 'Celsius to Fahrenheit' },
        { category: 'temperature', from: 'f', to: 'c', label: 'Fahrenheit to Celsius' }
    ];

    const handleQuickConversion = (conv) => {
        setCategory(conv.category);
        setFromUnit(conv.from);
        setToUnit(conv.to);
        setInputValue('');
        setResult('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-3xl">📏</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Unit Converter
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Convert between different units of measurement instantly. Weight, length, temperature, volume, area, speed, and time.
                    </p>
                </div>

                {/* Quick Conversions */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Conversions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {quickConversions.map((conv, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickConversion(conv)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                                    category === conv.category && fromUnit === conv.from && toUnit === conv.to
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {conv.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Converter */}
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    {/* Category Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Select Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                            {Object.entries(conversionData).map(([key, cat]) => (
                                <button
                                    key={key}
                                    onClick={() => handleCategoryChange(key)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                        category === key
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                                    }`}
                                >
                                    <span className="text-2xl mb-1">{cat.icon}</span>
                                    <span className="text-xs font-medium">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversion Inputs */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* From Unit */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                From
                            </label>
                            <select
                                value={fromUnit}
                                onChange={(e) => setFromUnit(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                            >
                                {Object.entries(conversionData[category].units).map(([key, unit]) => (
                                    <option key={key} value={key}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter value"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            />
                        </div>

                        {/* Swap Button */}
                        <div className="hidden md:flex items-end justify-center pb-3">
                            <button
                                onClick={handleSwapUnits}
                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                title="Swap units"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                        </div>

                        {/* To Unit */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                To
                            </label>
                            <select
                                value={toUnit}
                                onChange={(e) => setToUnit(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                            >
                                {Object.entries(conversionData[category].units).map(([key, unit]) => (
                                    <option key={key} value={key}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                            <div className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-lg font-semibold text-blue-900">
                                {result || '0'}
                            </div>
                        </div>

                        {/* Mobile Swap Button */}
                        <div className="md:hidden col-span-2 flex justify-center -mt-3 mb-3">
                            <button
                                onClick={handleSwapUnits}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                title="Swap units"
                            >
                                <svg className="w-5 h-5 text-gray-600 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-center text-lg">
                                <span className="font-semibold text-gray-900">{inputValue}</span>
                                <span className="text-gray-600 mx-2">{conversionData[category].units[fromUnit].name}</span>
                                <span className="text-gray-500">=</span>
                                <span className="font-bold text-green-700 mx-2">{result}</span>
                                <span className="text-gray-600">{conversionData[category].units[toUnit].name}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Privacy Badge */}
                <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-green-900 mb-1">100% Client-Side Conversion</h3>
                            <p className="text-green-800 text-sm">
                                All conversions happen directly in your browser. No data is sent to any server. Fast, private, and secure.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How accurate are the conversions?</h3>
                            <p className="text-gray-600">
                                Our unit converter uses standard conversion factors recognized internationally. Results are calculated to 6 decimal places for maximum precision.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What types of units can I convert?</h3>
                            <p className="text-gray-600">
                                You can convert between units of weight (kg, lbs, g, oz, etc.), length (m, ft, in, mi, etc.), temperature (°C, °F, K), volume (L, gal, ml, etc.), area (m², ft², acre, etc.), speed (km/h, mph, m/s, etc.), and time (s, min, hr, day, etc.).
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600">
                                Yes! Our unit converter is completely free with no hidden fees or limitations. Convert as many units as you need, anytime.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Does it work offline?</h3>
                            <p className="text-gray-600">
                                After the initial page load, the converter works entirely in your browser and doesn't require an internet connection.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitConverter;
