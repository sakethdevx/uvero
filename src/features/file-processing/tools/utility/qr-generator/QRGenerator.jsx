import { useState } from 'react';
import QRCode from 'qrcode';
import Button from '../../../shared/Button';

const QRGenerator = () => {
    const [inputType, setInputType] = useState('url');
    const [inputData, setInputData] = useState('');
    const [qrSize, setQrSize] = useState(512);
    const [errorLevel, setErrorLevel] = useState('M');
    const [foregroundColor, setForegroundColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [qrCode, setQrCode] = useState(null);
    const [error, setError] = useState('');

    const inputTypes = [
        { value: 'url', label: 'Website URL', icon: '🔗', placeholder: 'https://example.com' },
        { value: 'text', label: 'Plain Text', icon: '📝', placeholder: 'Enter your text here' },
        { value: 'email', label: 'Email', icon: '📧', placeholder: 'email@example.com' },
        { value: 'phone', label: 'Phone Number', icon: '📱', placeholder: '+1234567890' },
        { value: 'sms', label: 'SMS', icon: '💬', placeholder: '+1234567890:Your message' },
        { value: 'wifi', label: 'WiFi', icon: '📶', placeholder: 'SSID:password:WPA' }
    ];

    const errorLevels = [
        { value: 'L', label: 'Low (7%)', description: 'Smaller QR code' },
        { value: 'M', label: 'Medium (15%)', description: 'Balanced' },
        { value: 'Q', label: 'Quartile (25%)', description: 'Recommended' },
        { value: 'H', label: 'High (30%)', description: 'Most durable' }
    ];

    const formatInput = (type, data) => {
        if (!data) return data;

        switch (type) {
            case 'email':
                return `mailto:${data}`;
            case 'phone':
                return `tel:${data}`;
            case 'sms': {
                const [phone, message] = data.split(':');
                return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
            }
            case 'wifi': {
                const [ssid, password, security = 'WPA'] = data.split(':');
                return `WIFI:T:${security};S:${ssid};P:${password};;`;
            }
            default:
                return data;
        }
    };

    const handleGenerate = async () => {
        if (!inputData.trim()) {
            setError('Please enter some data to generate QR code');
            return;
        }

        setError('');

        try {
            const formattedData = formatInput(inputType, inputData);

            const options = {
                width: qrSize,
                errorCorrectionLevel: errorLevel,
                color: {
                    dark: foregroundColor,
                    light: backgroundColor
                },
                margin: 2
            };

            const dataUrl = await QRCode.toDataURL(formattedData, options);
            setQrCode(dataUrl);
        } catch (err) {
            setError('Failed to generate QR code. Please check your input.');
            console.error(err);
        }
    };

    const handleDownloadPNG = () => {
        if (!qrCode) return;

        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = qrCode;
        link.click();
    };

    const handleDownloadSVG = async () => {
        if (!inputData.trim()) return;

        try {
            const formattedData = formatInput(inputType, inputData);

            const options = {
                width: qrSize,
                errorCorrectionLevel: errorLevel,
                color: {
                    dark: foregroundColor,
                    light: backgroundColor
                },
                margin: 2,
                type: 'svg'
            };

            const svg = await QRCode.toString(formattedData, options);
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.svg`;
            link.href = url;
            link.click();

            URL.revokeObjectURL(url);
        } catch {
            setError('Failed to generate SVG. Please check your input.');
        }
    };

    const handleReset = () => {
        setInputData('');
        setQrCode(null);
        setError('');
    };

    const selectedType = inputTypes.find(t => t.value === inputType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        QR Code Generator
                    </h1>
                    <p className="text-lg text-gray-600">
                        Create custom QR codes for URLs, text, WiFi, and more
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    {/* Input Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            QR Code Type
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {inputTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => {
                                        setInputType(type.value);
                                        setInputData('');
                                        setQrCode(null);
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all ${inputType === type.value
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{type.icon}</div>
                                    <div className="text-xs font-medium text-gray-700">
                                        {type.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Data */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            {selectedType?.label} Content
                        </label>
                        <textarea
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                            placeholder={selectedType?.placeholder}
                            rows={inputType === 'text' ? 4 : 2}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                        {inputType === 'wifi' && (
                            <p className="text-xs text-gray-500 mt-2">
                                Format: NetworkName:Password:SecurityType (e.g., MyWiFi:password123:WPA)
                            </p>
                        )}
                        {inputType === 'sms' && (
                            <p className="text-xs text-gray-500 mt-2">
                                Format: PhoneNumber:Message (e.g., +1234567890:Hello!)
                            </p>
                        )}
                    </div>

                    {/* Customization Options */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Size */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Size: {qrSize}px
                            </label>
                            <input
                                type="range"
                                min="128"
                                max="1024"
                                step="64"
                                value={qrSize}
                                onChange={(e) => setQrSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Small</span>
                                <span>Large</span>
                            </div>
                        </div>

                        {/* Error Correction Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Error Correction
                            </label>
                            <select
                                value={errorLevel}
                                onChange={(e) => setErrorLevel(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                            >
                                {errorLevels.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label} - {level.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Foreground Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                QR Code Color
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={foregroundColor}
                                    onChange={(e) => setForegroundColor(e.target.value)}
                                    className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                />
                                <input
                                    type="text"
                                    value={foregroundColor}
                                    onChange={(e) => setForegroundColor(e.target.value)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Background Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Background Color
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                />
                                <input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="mb-6">
                        <Button
                            onClick={handleGenerate}
                            disabled={!inputData.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            Generate QR Code
                        </Button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* QR Code Result */}
                    {qrCode && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your QR Code</h3>

                            <div className="flex flex-col md:flex-row gap-6">
                                {/* QR Code Preview */}
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
                                        <img
                                            src={qrCode}
                                            alt="Generated QR Code"
                                            className="max-w-full"
                                            style={{ width: Math.min(qrSize, 400) }}
                                        />
                                    </div>
                                </div>

                                {/* Download Options */}
                                <div className="md:w-64 space-y-3">
                                    <Button
                                        onClick={handleDownloadPNG}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                    >
                                        Download PNG
                                    </Button>
                                    <Button
                                        onClick={handleDownloadSVG}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        Download SVG
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        Create Another
                                    </Button>

                                    <div className="bg-indigo-50 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-indigo-900 font-medium mb-2">
                                            💡 Quick Tips
                                        </p>
                                        <ul className="text-xs text-indigo-800 space-y-1">
                                            <li>• PNG for web and print</li>
                                            <li>• SVG for scalable graphics</li>
                                            <li>• Test before printing</li>
                                            <li>• Higher error correction = more durable</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Customize Your QR Code</h3>
                                <p className="text-gray-600 text-sm">
                                    Choose from multiple types, adjust size, colors, and error correction level. Perfect for business cards, posters, products, and more.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">100% Private & Secure</h3>
                                <p className="text-gray-600 text-sm">
                                    All QR codes are generated locally in your browser. Your data never leaves your device, ensuring complete privacy and security.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What types of QR codes can I create?</h3>
                            <p className="text-gray-600">
                                You can create QR codes for URLs, plain text, emails, phone numbers, SMS messages, and WiFi credentials. Each type is optimized for its specific use case.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What's the difference between PNG and SVG?</h3>
                            <p className="text-gray-600">
                                PNG is a raster format perfect for web and print at a specific size. SVG is a vector format that scales infinitely without quality loss - ideal for large prints or when you need flexibility.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What is error correction?</h3>
                            <p className="text-gray-600">
                                Error correction allows the QR code to be readable even if partially damaged or obscured. Higher levels (H) are more durable but create larger, more complex codes. Medium (M) or Quartile (Q) are recommended for most uses.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Do QR codes expire?</h3>
                            <p className="text-gray-600">
                                No! QR codes generated here never expire and will work forever. Since they're static codes created locally, there's no tracking or expiration - they contain the data directly.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I use custom colors?</h3>
                            <p className="text-gray-600">
                                Yes! You can customize both the QR code color and background color. For best scanning reliability, ensure high contrast between the two colors (dark code on light background works best).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRGenerator;
