import { MAX_RENDER_SCALE, RENDER_QUALITY_PRESETS } from './renderConstants';

export const getRenderSettings = (options = {}) => {
    const presetKey = options.qualityPreset || 'medium';
    const preset = RENDER_QUALITY_PRESETS[presetKey] || RENDER_QUALITY_PRESETS.medium;
    const explicitScale = Number(options.scale);
    const scale = Number.isFinite(explicitScale) && explicitScale > 0
        ? Math.min(explicitScale, MAX_RENDER_SCALE)
        : preset.scale;
    const explicitQuality = Number(options.imageQuality);
    const imageQuality = Number.isFinite(explicitQuality)
        ? Math.max(0.1, Math.min(1, explicitQuality))
        : preset.imageQuality;

    return {
        ...preset,
        scale,
        imageQuality,
        presetKey,
    };
};

export const assertViewportWithinLimits = (viewport, settings, pageNumber) => {
    const pixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
    if (pixels > settings.maxPixels) {
        throw new Error(
            `Page ${pageNumber} is too large for the selected quality. Choose a lower quality preset.`
        );
    }
};
