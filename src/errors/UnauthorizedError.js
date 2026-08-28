import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class UnauthorizedError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.UNAUTHORIZED, details);
    }
}

export { UnauthorizedError };
