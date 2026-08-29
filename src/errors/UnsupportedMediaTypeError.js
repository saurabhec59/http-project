import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class UnsupportedMediaTypeError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.UNSUPPORTED_MEDIA_TYPE, details);
    }
}

export { UnsupportedMediaTypeError };
