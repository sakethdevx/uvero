export const getFileNameWithoutExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return filename;
    return filename.slice(0, lastDot);
};

export const generateMergedFilename = (files) => {
    if (files.length === 0) return 'merged.pdf';
    const firstName = getFileNameWithoutExtension(files[0].name);

    if (files.length === 2) {
        const secondName = getFileNameWithoutExtension(files[1].name);
        return `${firstName}_${secondName}_merged.pdf`;
    }

    return `${firstName}_and_${files.length - 1}_more_merged.pdf`;
};

export const loadFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};
