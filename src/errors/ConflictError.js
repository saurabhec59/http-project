import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class ConflictError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.CONFLICT, details);
    }
}

export { ConflictError };
