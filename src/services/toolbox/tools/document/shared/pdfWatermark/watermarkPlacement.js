export function computeTextWatermarkPosition(
    pageWidth,
    pageHeight,
    textWidth,
    textHeight,
    rotation,
    position
) {
    if (position === 'top-left') {
        return { x: 50, y: pageHeight - 50 };
    } else if (position === 'top-right') {
        return { x: Math.max(0, pageWidth - textWidth - 50), y: pageHeight - 50 };
    } else if (position === 'bottom-left') {
        return { x: 50, y: Math.max(0, 50 + textHeight) };
    } else if (position === 'bottom-right') {
        return { x: Math.max(0, pageWidth - textWidth - 50), y: Math.max(0, 50 + textHeight) };
    }

    // Default to center
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    const textWidthHalf = textWidth / 2;
    const textHeightHalf = textHeight / 2;
    const baselineOffset = textHeight * 0.25;

    const baseX = centerX - textWidthHalf;
    const baseY = centerY - (textHeightHalf + baselineOffset);

    // If there is rotation, adjust origin so it rotates around the center of the text
    const rotationRad = (Math.abs(rotation) * Math.PI) / 180;
    const cosRad = Math.cos(rotationRad);
    const sinRad = Math.sin(rotationRad);

    const rotationSign = Math.sign(rotation);

    let rotatedOriginX = baseX + textWidthHalf * (1 - cosRad) + rotationSign * baselineOffset;
    let rotatedOriginY = baseY - rotationSign * (textWidthHalf * sinRad) + baselineOffset * Math.abs(rotationSign);

    return {
        x: rotatedOriginX,
        y: rotatedOriginY,
    };
}
