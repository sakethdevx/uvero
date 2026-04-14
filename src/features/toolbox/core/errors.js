export class ModeNotSupportedError extends Error {
    constructor(toolId, mode, supportedModes = []) {
        super(`Mode "${mode}" is not supported for tool "${toolId}". Supported modes: ${supportedModes.join(', ') || 'none'}`);
        this.name = 'ModeNotSupportedError';
        this.toolId = toolId;
        this.mode = mode;
        this.supportedModes = supportedModes;
    }
}

export function createModeNotSupportedError(toolId, mode, supportedModes = []) {
    return new ModeNotSupportedError(toolId, mode, supportedModes);
}

export class ServiceUnavailableError extends Error {
    constructor(toolId, message, status = 503) {
        super(message);
        this.name = 'ServiceUnavailableError';
        this.toolId = toolId;
        this.status = status;
    }
}

export function createServiceUnavailableError(toolId, message, status = 503) {
    return new ServiceUnavailableError(toolId, message, status);
}
