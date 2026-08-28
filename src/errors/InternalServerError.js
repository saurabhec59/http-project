import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class InternalServerError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.INTERNAL_SERVER_ERROR, details);
    }
}

export { InternalServerError };
