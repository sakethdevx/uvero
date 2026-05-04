import React from 'react';
import Dropzone from '../shared/Dropzone.jsx';

const WATERMARK_POSITIONS = [
    { value: 'top-left', label: 'Top Left', icon: '↖️' },
    { value: 'top-center', label: 'Top Center', icon: '⬆️' },
    { value: 'top-right', label: 'Top Right', icon: '↗️' },
    { value: 'center-left', label: 'Center Left', icon: '⬅️' },
    { value: 'center', label: 'Center', icon: '⏺️' },
    { value: 'center-right', label: 'Center Right', icon: '➡️' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
    { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' }
];

export default function WatermarkSettings({ options, onChange }) {
    const updateOption = (key, value) => {
        onChange({ ...options, [key]: value });
    };

    return (
        <div className="border-2 border-cyan-200 dark:border-cyan-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🎨 Watermark Settings
            </h3>

            {/* Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                    onClick={() => updateOption('type', 'text')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${options.type === 'text' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Text
                </button>
                <button
                    onClick={() => updateOption('type', 'image')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${options.type === 'image' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Logo
                </button>
            </div>

            {options.type === 'text' ? (
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Watermark Text</label>
                        <input
                            type="text"
                            value={options.text}
                            onChange={(e) => updateOption('text', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="© Your Name"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Font Size ({options.fontSize}px)</label>
                            <input
                                type="range"
                                min="10"
                                max="150"
                                value={options.fontSize}
                                onChange={(e) => updateOption('fontSize', parseInt(e.target.value))}
                                className="w-full accent-cyan-600"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Color</label>
                            <input
                                type="color"
                                value={options.color}
                                onChange={(e) => updateOption('color', e.target.value)}
                                className="w-full h-8 bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Watermark Logo</label>
                    {options.watermarkImage ? (
                        <div className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/30 rounded-lg p-2">
                            <span className="text-[10px] truncate max-w-[150px]">{options.watermarkImage.name}</span>
                            <button onClick={() => updateOption('watermarkImage', null)} className="text-red-500 hover:text-red-600 text-xs font-bold px-1">✕</button>
                        </div>
                    ) : (
                        <div className="scale-90 origin-top">
                            <Dropzone
                                onFileSelect={(file) => updateOption('watermarkImage', file)}
                                accept="image/png,image/svg+xml,.png,.svg"
                                maxSize={5 * 1024 * 1024}
                                label="Drop logo"
                                description="PNG/SVG only"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-100 dark:border-cyan-900/30">
                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Opacity ({Math.round(options.opacity * 100)}%)</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={options.opacity}
                        onChange={(e) => updateOption('opacity', parseFloat(e.target.value))}
                        className="w-full accent-cyan-600"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Position</label>
                    <select
                        value={options.position}
                        onChange={(e) => updateOption('position', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none"
                    >
                        {WATERMARK_POSITIONS.map(pos => (
                            <option key={pos.value} value={pos.value}>{pos.icon} {pos.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
