/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import Button from '../../../shared/Button';

const PasswordGenerator = () => {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [excludeSimilar, setExcludeSimilar] = useState(false);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
    const [copied, setCopied] = useState(false);

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similarChars = 'il1Lo0O';
    const ambiguousChars = '{}[]()/\\\'"`~,;:.<>';

    const generatePassword = useCallback(() => {
        let charset = '';
        let newPassword = '';

        if (includeUppercase) charset += uppercase;
        if (includeLowercase) charset += lowercase;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;

        if (excludeSimilar) {
            charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
        }
        if (excludeAmbiguous) {
            charset = charset.split('').filter(char => !ambiguousChars.includes(char)).join('');
        }

        if (charset.length === 0) {
            setPassword('');
            return;
        }

        // Use crypto.getRandomValues for cryptographically secure random numbers
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            newPassword += charset[array[i] % charset.length];
        }

        setPassword(newPassword);
        setCopied(false);
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

    const calculateStrength = (pwd) => {
        if (!pwd) return { score: 0, label: 'None', color: 'gray' };

        let score = 0;

        // Length
        if (pwd.length >= 8) score += 1;
        if (pwd.length >= 12) score += 1;
        if (pwd.length >= 16) score += 1;

        // Character variety
        if (/[a-z]/.test(pwd)) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

        // Determine label and color
        if (score <= 2) return { score, label: 'Weak', color: 'red' };
        if (score <= 4) return { score, label: 'Fair', color: 'orange' };
        if (score <= 5) return { score, label: 'Good', color: 'yellow' };
        if (score <= 6) return { score, label: 'Strong', color: 'green' };
        return { score, label: 'Very Strong', color: 'green' };
    };

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);

    // Calculate strength whenever password changes (derived state)
    const strength = calculateStrength(password);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getStrengthBarWidth = () => {
        return `${(strength.score / 7) * 100}%`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Password Generator
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Create strong, secure passwords with customizable options
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {/* Generated Password Display */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Your Password
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={password}
                                readOnly
                                className="w-full px-4 py-4 pr-24 text-lg font-mono bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none"
                            />
                            <Button
                                onClick={handleCopy}
                                disabled={!password}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2"
                            >
                                {copied ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copied
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                    </span>
                                )}
                            </Button>
                        </div>

                        {/* Strength Indicator */}
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Password Strength:</span>
                                <span className={`text-sm font-semibold text-${strength.color}-600`}>
                                    {strength.label}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                                    style={{ width: getStrengthBarWidth() }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Length Slider */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Password Length
                            </label>
                            <span className="text-lg font-bold text-cyan-600">{length}</span>
                        </div>
                        <input
                            type="range"
                            min="6"
                            max="64"
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>6</span>
                            <span>64</span>
                        </div>
                    </div>

                    {/* Character Options */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Character Types
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeUppercase}
                                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Uppercase Letters (A-Z)</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeLowercase}
                                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Lowercase Letters (a-z)</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">abcdefghijklmnopqrstuvwxyz</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeNumbers}
                                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Numbers (0-9)</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">0123456789</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeSymbols}
                                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Symbols</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">!@#$%^&*()_+-=[]|;:,.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Advanced Options
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={excludeSimilar}
                                    onChange={(e) => setExcludeSimilar(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Exclude Similar Characters</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Avoid confusion: i, l, 1, L, o, 0, O</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={excludeAmbiguous}
                                    onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Exclude Ambiguous Symbols</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Avoid special chars: {`{} [] () / \\ ' " \` ~ , ; : . < >`}</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={generatePassword}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                        Generate New Password
                    </Button>
                </div>

                {/* Info Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cryptographically Secure</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Uses Web Crypto API for truly random password generation. Each password is unique and unpredictable.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    All passwords are generated in your browser. Nothing is sent to any server or stored anywhere.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Tips */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Password Security Tips</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Use at least 12-16 characters</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Longer passwords are exponentially harder to crack.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mix different character types</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Combine uppercase, lowercase, numbers, and symbols for maximum security.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Use unique passwords for each account</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Never reuse passwords across different websites or services.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Use a password manager</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Store your passwords securely in a reputable password manager.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Enable two-factor authentication</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Add an extra layer of security whenever possible.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-cyan-50 border-l-4 border-cyan-500 rounded">
                        <p className="text-sm text-cyan-900">
                            <strong>💡 Pro Tip:</strong> For maximum security, use a password manager to generate, store, and auto-fill unique passwords for all your accounts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;
