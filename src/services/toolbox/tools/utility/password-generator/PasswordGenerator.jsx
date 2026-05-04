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
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-8">
                {/* Generated Password Display */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                        Generated Password
                    </label>
                    <div className="relative group/pwd">
                        <input
                            type="text"
                            value={password}
                            readOnly
                            className="w-full px-5 py-5 pr-28 text-lg font-mono bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none transition-all duration-300 shadow-sm dark:shadow-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5 p-1">
                            <button
                                onClick={handleCopy}
                                disabled={!password}
                                className="suggestion-chip !opacity-100 !animate-none flex items-center gap-2 h-10 px-4 active:scale-95 transition-transform"
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-600 dark:text-green-400">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Strength Indicator */}
                    <div className="glass-subtle p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Security Score</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                strength.color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                                strength.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                                'bg-orange-500/10 border-orange-500/20 text-orange-600'
                            }`}>
                                {strength.label}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-apple ${
                                    strength.color === 'green' ? 'bg-green-500' :
                                    strength.color === 'red' ? 'bg-red-500' :
                                    'bg-orange-500'
                                }`}
                                style={{ width: getStrengthBarWidth() }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-8">
                        {/* Character Options */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                Character Types
                            </label>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'upper', checked: includeUppercase, setter: setIncludeUppercase, label: 'Uppercase', desc: 'A-Z', chars: uppercase },
                                    { id: 'lower', checked: includeLowercase, setter: setIncludeLowercase, label: 'Lowercase', desc: 'a-z', chars: lowercase },
                                    { id: 'nums', checked: includeNumbers, setter: setIncludeNumbers, label: 'Numbers', desc: '0-9', chars: numbers },
                                    { id: 'syms', checked: includeSymbols, setter: setIncludeSymbols, label: 'Symbols', desc: '!@#$', chars: symbols }
                                ].map((opt) => (
                                    <label 
                                        key={opt.id}
                                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                            opt.checked 
                                            ? 'border-indigo-500 bg-indigo-500/[0.03] dark:bg-indigo-500/5' 
                                            : 'border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-white dark:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                            opt.checked ? 'bg-indigo-500 border-indigo-500' : 'border-gray-200 dark:border-white/10'
                                        }`}>
                                            {opt.checked && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={opt.checked}
                                            onChange={(e) => opt.setter(e.target.checked)}
                                            className="hidden"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">{opt.chars}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Options */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                Refinements
                            </label>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'sim', checked: excludeSimilar, setter: setExcludeSimilar, label: 'Exclude Similar', desc: 'Avoid confusion: i, l, 1, L, o, 0, O' },
                                    { id: 'amb', checked: excludeAmbiguous, setter: setExcludeAmbiguous, label: 'Exclude Ambiguous', desc: 'Avoid special chars: { } [ ] ( ) / \\' }
                                ].map((opt) => (
                                    <label 
                                        key={opt.id}
                                        className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                            opt.checked 
                                            ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/5' 
                                            : 'border-gray-100 dark:border-white/5 hover:border-purple-200 dark:hover:border-purple-900/50 bg-white dark:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all ${
                                            opt.checked ? 'bg-purple-500 border-purple-500' : 'border-gray-200 dark:border-white/10'
                                        }`}>
                                            {opt.checked && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={opt.checked}
                                            onChange={(e) => opt.setter(e.target.checked)}
                                            className="hidden"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{opt.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Length Control */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                    Character Length
                                </label>
                                <span className="text-xl font-black text-indigo-500 tabular-nums">{length}</span>
                            </div>
                            <div className="glass-subtle p-5 rounded-2xl space-y-4">
                                <input
                                    type="range"
                                    min="6"
                                    max="64"
                                    value={length}
                                    onChange={(e) => setLength(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>6 chars</span>
                                    <span>64 chars</span>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={generatePassword}
                            className="w-full btn-accent py-4 rounded-2xl flex items-center justify-center gap-3 group/gen"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover/gen:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generate New Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;
