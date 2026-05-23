import { computeTextWatermarkPosition } from './watermarkPlacement';

export const renderTextWatermark = (page, text, font, options, pdfLib) => {
    const { width, height } = page.getSize();

    const fontSize = options.fontSize || 48;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    const rotation = options.rotation || 0;
    const opacity = options.opacity !== undefined ? options.opacity : 0.3;
    const color = options.color || { r: 128, g: 128, b: 128 };

    const rgbColor = pdfLib.rgb(color.r / 255, color.g / 255, color.b / 255);

    const { x, y } = computeTextWatermarkPosition(
        width,
        height,
        textWidth,
        textHeight,
        rotation,
        options.position
    );

    page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgbColor,
        opacity,
        rotate: pdfLib.degrees(rotation),
    });
};
