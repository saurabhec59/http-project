import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class ForbiddenError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.FORBIDDEN, details);
    }
}

export { ForbiddenError };
