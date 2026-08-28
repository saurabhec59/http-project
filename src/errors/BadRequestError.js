import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class BadRequestError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.BAD_REQUEST, details);
    }
}

export { BadRequestError };
