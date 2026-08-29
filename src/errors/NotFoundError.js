import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class NotFoundError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.NOT_FOUND, details);
    }
}

export { NotFoundError };
