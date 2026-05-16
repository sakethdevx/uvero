export const getSecuredFileName = (originalFilename, operation) => {
    const nameWithoutExt = originalFilename.replace(/\.pdf$/i, '');
    const timestamp = Date.now();
    
    switch (operation) {
        case 'encrypt':
            return `${nameWithoutExt}_secured_${timestamp}.pdf`;
        case 'decrypt':
            return `${nameWithoutExt}_unsecured_${timestamp}.pdf`;
        case 'changePassword':
            return `${nameWithoutExt}_passwordChanged_${timestamp}.pdf`;
        case 'managePermissions':
            return `${nameWithoutExt}_permissionsUpdated_${timestamp}.pdf`;
        default:
            return `${nameWithoutExt}_processed_${timestamp}.pdf`;
    }
};

export const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const calculatePermissionMask = (permissions) => {
    let mask = 0;
    
    for (const [permission, value] of Object.entries(permissions)) {
        if (value) {
            mask |= value;
        }
    }
    
    return mask;
};

export const getPermissionDescription = (permissionMask) => {
    const permissions = [];
    
    const permissionMap = {
        0x04: 'Print',
        0x08: 'Modify Contents',
        0x10: 'Copy',
        0x20: 'Modify Annotations',
        0x100: 'Fill Form',
        0x200: 'Copy for Accessibility',
        0x400: 'Assemble Document',
        0x800: 'High Quality Print'
    };
    
    for (const [value, description] of Object.entries(permissionMap)) {
        if (permissionMask & parseInt(value)) {
            permissions.push(description);
        }
    }
    
    return permissions.length > 0 ? permissions.join(', ') : 'No permissions';
};

export const isValidEncryptionAlgorithm = (algorithm) => {
    const validAlgorithms = ['AES_128', 'AES_256', 'RC4_40', 'RC4_128'];
    return validAlgorithms.includes(algorithm);
};
