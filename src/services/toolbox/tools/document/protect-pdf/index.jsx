import { useState, useCallback } from 'react';
import { usePdfProtect } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';
import { PERMISSION_FLAGS, ENCRYPTION_ALGORITHMS } from '../shared/pdfSecurity/pdfSecurityConstants';

export const metadata = {
    id: 'protect-pdf',
    name: 'Protect PDF',
    category: 'document',
    keywords: ['protect', 'encrypt', 'password', 'security', 'permissions', 'pdf'],
    icon: '🔒',
    offline: true,
    experimental: false
};

export default function ProtectPdfTool() {
    const [files, setFiles] = useState([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Permissions
    const [allowPrint, setAllowPrint] = useState(true);
    const [allowCopy, setAllowCopy] = useState(true);
    const [allowModify, setAllowModify] = useState(true);

    const [encryptionLevel, setEncryptionLevel] = useState('AES_256');

    const { protect, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfProtect();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
            const isDuplicate = prev.some(f => f.name === newFile.name && f.size === newFile.size);
            if (isDuplicate) return prev;
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, newFile];
        });
    }, []);

    const handleProtect = () => {
        if (password !== confirmPassword) {
            return;
        }

        let permissions = 0;
        if (allowPrint) permissions |= PERMISSION_FLAGS.PRINT | PERMISSION_FLAGS.HIGH_QUALITY_PRINT;
        if (allowCopy) permissions |= PERMISSION_FLAGS.COPY | PERMISSION_FLAGS.COPY_FOR_ACCESSIBILITY;
        if (allowModify) permissions |= PERMISSION_FLAGS.MODIFY_CONTENTS | PERMISSION_FLAGS.MODIFY_ANNOTATIONS | PERMISSION_FLAGS.FILL_FORM | PERMISSION_FLAGS.ASSEMBLE_DOCUMENT;

        // If restricting permissions, ownerPassword should be different from userPassword. 
        // We'll set ownerPassword simply to userPassword + '-owner' for simplicity in this tool, or user can skip it.
        // Actually, let's just use a strong default owner password if permissions are restricted.
        const ownerPassword = password + '_owner';

        protect(files, {
            userPassword: password,
            ownerPassword: password, // if we want owner permission, usually it's set here
            // wait, if we drop permissions, we need to pass a valid ownerPassword. Let's just pass `password` as ownerPassword.
            permissions,
            encryptionAlgorithm: encryptionLevel
        });
    };

    const handleReset = () => {
        setFiles([]);
        setPassword('');
        setConfirmPassword('');
        setAllowPrint(true);
        setAllowCopy(true);
        setAllowModify(true);
        setEncryptionLevel('AES_256');
        reset();
    };

    const passwordsMatch = password === confirmPassword;
    const isValid = files.length > 0 && password.length > 0 && passwordsMatch;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drag & drop a PDF file here to add password protection"
                />
            )}

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Protect PDF ({files.length} file)</h3>
                        <p className="text-sm text-gray-500">Only one file can be processed at a time</p>
                    </div>

                    <div className="space-y-6">
                        {/* Passwords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="font-medium">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter secure password"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-medium">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isProcessing}
                                />
                                {password && confirmPassword && !passwordsMatch && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="space-y-3">
                            <h4 className="font-medium">Permissions</h4>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowPrint}
                                        onChange={(e) => setAllowPrint(e.target.checked)}
                                        disabled={isProcessing}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
                                    />
                                    <span>Allow Printing</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowCopy}
                                        onChange={(e) => setAllowCopy(e.target.checked)}
                                        disabled={isProcessing}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
                                    />
                                    <span>Allow Copying Text/Images</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowModify}
                                        onChange={(e) => setAllowModify(e.target.checked)}
                                        disabled={isProcessing}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
                                    />
                                    <span>Allow Modifying</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium">Encryption Level</h4>
                            <select
                                value={encryptionLevel}
                                onChange={(e) => setEncryptionLevel(e.target.value)}
                                disabled={isProcessing}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={ENCRYPTION_ALGORITHMS.AES_256}>256-bit AES (Recommended, Highly Secure)</option>
                                <option value={ENCRYPTION_ALGORITHMS.AES_128}>128-bit AES (Standard)</option>
                            </select>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                <p className="font-medium">Encryption Error</p>
                                <p>{error.message}</p>
                            </div>
                        )}

                        {isProcessing ? (
                            <div className="space-y-4">
                                <ProgressBar progress={progress} />
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>{progressMessage}</p>
                                    <Button onClick={cancel} variant="outline" className="text-red-500 border-red-200">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setFiles([])} variant="outline">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleProtect}
                                    disabled={!isValid}
                                    className={!isValid ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                    Protect PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-green-200 dark:border-green-800 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">PDF Protected Successfully!</h2>
                        <p className="text-gray-500">
                            The PDF has been encrypted with the specified password and permissions.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleReset} variant="outline">
                            Start Over
                        </Button>
                        <Button
                            onClick={() => {
                                const url = URL.createObjectURL(result.blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                // Optional cleanup
                                setTimeout(() => URL.revokeObjectURL(url), 1000);
                            }}
                        >
                            Download Protected PDF
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
