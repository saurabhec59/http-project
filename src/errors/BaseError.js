class BaseError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);

        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
    }
}

export { BaseError };

/*
THIS => IN JS
it can create a property in class object like:
here this.statusCode = statusCode; => this line will create a property named statusCode in the object of BaseError class and assign it a value of statusCode passed in constructor.

lets understand the the structure of Error handling we are creating here:
So when we do: throw new Error("some error message") and centrally if at one place we are catching and handling it then the message is
not the sufficient information to handle error properly.
With the above thing we can do only : error.message but we do not know status code, other error details.
So at the end we want error object to have something like these fields:
    error.message,
    error.statusCode,
    error.details.
    error.name....

But we can create this in each individual error class like ValidationError, NotFoundError etc.
but that will be a lot of code duplication because all these classes will have same structure and only difference is statusCode and name of the class.
So we are creating a base class and other custom error classes will extend this base class and they just need to pass details, not to create same properties in each custom class.
*/