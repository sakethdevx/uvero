/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Button from '../../../shared/Button';

const UnitConverter = () => {
    const [category, setCategory] = useState('weight');
    const [fromUnit, setFromUnit] = useState('kg');
    const [toUnit, setToUnit] = useState('lbs');
    const [inputValue, setInputValue] = useState('');
    const [result, setResult] = useState('');

    const conversionData = useMemo(() => ({
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
    }), []);

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

    const convert = useCallback((value, from, to, cat) => {
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
    }, [conversionData]);

    useEffect(() => {
        if (inputValue && !isNaN(inputValue)) {
            const converted = convert(inputValue, fromUnit, toUnit, category);
            // Format the result: remove unnecessary trailing zeros but keep significant digits
            const formatted = converted.toFixed(6).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
            setResult(formatted);
        } else {
            setResult('');
        }
    }, [inputValue, fromUnit, toUnit, category, convert]);

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
        setInputValue('');    return (
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-10">
                {/* Category Selector */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">
                        Select Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {Object.entries(conversionData).map(([key, cat]) => (
                            <button
                                key={key}
                                onClick={() => handleCategoryChange(key)}
                                className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                                    category === key
                                        ? 'border-blue-500 bg-blue-500/[0.05] shadow-sm'
                                        : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/50 bg-white dark:bg-white/[0.02]'
                                }`}
                            >
                                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    category === key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                                }`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversion Interface */}
                <div className="grid lg:grid-cols-[1fr_auto_1fr] items-center gap-6">
                    {/* From Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                Source Unit
                            </label>
                            <select
                                value={fromUnit}
                                onChange={(e) => setFromUnit(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all appearance-none cursor-pointer"
                            >
                                {Object.entries(conversionData[category].units).map(([key, unit]) => (
                                    <option key={key} value={key}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter value..."
                            className="w-full px-5 py-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none transition-all font-mono text-lg shadow-sm dark:shadow-none"
                        />
                    </div>

                    {/* Swap Connector */}
                    <div className="flex justify-center lg:pt-6">
                        <button
                            onClick={handleSwapUnits}
                            className="suggestion-chip !opacity-100 !animate-none p-4 rounded-full hover:rotate-180 transition-transform duration-500 group/swap"
                            title="Swap Units"
                        >
                            <svg className="w-6 h-6 text-blue-500 lg:rotate-0 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    </div>

                    {/* To Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 ml-1">
                                Target Unit
                            </label>
                            <select
                                value={toUnit}
                                onChange={(e) => setToUnit(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none transition-all appearance-none cursor-pointer"
                            >
                                {Object.entries(conversionData[category].units).map(([key, unit]) => (
                                    <option key={key} value={key}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full px-5 py-4 bg-blue-500/[0.03] dark:bg-blue-500/5 border border-blue-500/20 rounded-2xl text-lg font-black text-blue-600 dark:text-blue-400 font-mono shadow-inner">
                            {result || '0.00'}
                        </div>
                    </div>
                </div>

                {/* Result Narrative */}
                {result && (
                    <div className="glass-subtle p-5 rounded-2xl bg-emerald-500/[0.03] border-emerald-500/20 flex flex-col items-center justify-center text-center animate-resultReveal">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span className="font-mono text-lg font-black text-gray-900 dark:text-white mr-2">{inputValue}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-3">{conversionData[category].units[fromUnit].name}</span>
                            <span className="text-gray-400 mr-3">is equivalent to</span>
                            <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400 mr-2">{result}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{conversionData[category].units[toUnit].name}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitConverter;
