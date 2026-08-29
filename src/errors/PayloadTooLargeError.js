import { BaseError } from './BaseError.js';
import STATUS_CODES from '../utils/status-codes.js';

class PayloadTooLargeError extends BaseError {
    constructor(message, details = {}) {
        super(message, STATUS_CODES.PAYLOAD_TOO_LARGE, details);
    }
}

export { PayloadTooLargeError };
