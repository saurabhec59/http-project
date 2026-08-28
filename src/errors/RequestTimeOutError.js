import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class RequestTimeoutError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.REQUEST_TIMEOUT, details);
    }
}

export { RequestTimeoutError };
