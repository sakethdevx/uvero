export const generateCleanedFilename = (originalName) => {
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot === -1 ? originalName : originalName.slice(0, lastDot);
    return `${baseName}_no_metadata.pdf`;
};
