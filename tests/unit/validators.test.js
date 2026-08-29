import {validateUpdateCustomerDetails, validateCustomerDetailsHandler} from '../../src/utils/validators.js';

// unit tests for validateCustomerDetailsHandler
describe("validateCustomerDetailsHandler - Customer Registration Validation", function(){

    describe("when req.body is missing or invalid", function(){
        it("should return false when req has no body property", function(){
            const req = {};
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when req.body is null", function(){
            const req = { body: null };
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when req.body is undefined", function(){
            const req = { body: undefined };
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })
    })

    describe("when required fields are missing", function(){
        it("should return false when email is missing", function(){
            const req = {
                body: {
                    name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when name is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when age is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when city is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when password is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })
    })

    describe("when field types are incorrect", function(){
        it("should return false when email is not a string", function(){
            const req = {
                body: {
                    email: 12345, name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when name is not a string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: 123, age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when age is not a number", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: "40", city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when city is not a string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: true, password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when password is not a string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: 12345678
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })
    })

    describe("email format validation", function(){
        it("should return false when email has no @ symbol", function(){
            const req = {
                body: {
                    email: "testgmail.com", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when email has no domain", function(){
            const req = {
                body: {
                    email: "test@", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when email has no username", function(){
            const req = {
                body: {
                    email: "@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when email has spaces", function(){
            const req = {
                body: {
                    email: "test @gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when email is empty string", function(){
            const req = {
                body: {
                    email: "", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return true for valid email with subdomain", function(){
            const req = {
                body: {
                    email: "test@mail.example.com", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return true for valid email with plus addressing", function(){
            const req = {
                body: {
                    email: "test+tag@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "password123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })
    })

    describe("password length validation", function(){
        it("should return false when password is empty string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: ""
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return false when password is 7 characters", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "1234567"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })

        it("should return true when password is exactly 8 characters", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "12345678"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return true when password is 12 characters", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "password1234"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return true when password is exactly 15 characters", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "123456789012345"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return false when password is 16 characters", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "1234567890123456"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(false);
        })
    })

    describe("with valid complete data", function(){
        it("should return true for valid customer data", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "validpass123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return true for minimum valid age", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 1, city: "Nowhere", password: "validpass123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })

        it("should return true for high valid age", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 150, city: "Nowhere", password: "validpass123"
                }
            }
            expect(validateCustomerDetailsHandler(req)).toBe(true);
        })
    })

})

// unit tests for validateUpdateCustomerDetails, This method does not check password field
describe("validateUpdateCustomerDetails - Customer Update Validation", function(){

    describe("when req.body is missing or invalid", function(){
        it("should return false when req has no body property", function(){
            const req = {};
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when req.body is null", function(){
            const req = { body: null };
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when req.body is undefined", function(){
            const req = { body: undefined };
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })
    })

    describe("when required fields are missing", function(){
        it("should return false when email is missing", function(){
            const req = {
                body: {
                    name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when name is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when age is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when city is missing", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })
    })

    describe("when field types are incorrect", function(){
        it("should return false when email is not a string", function(){
            const req = {
                body: {
                    email: 12345, name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when name is not a string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: 123, age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when age is not a number", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: "40", city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when city is not a string", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: 123
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })
    })

    describe("email format validation", function(){
        it("should return false when email has no @ symbol", function(){
            const req = {
                body: {
                    email: "testgmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when email has no domain", function(){
            const req = {
                body: {
                    email: "test@", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when email has no username", function(){
            const req = {
                body: {
                    email: "@gmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when email has spaces", function(){
            const req = {
                body: {
                    email: "test @gmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return false when email is empty string", function(){
            const req = {
                body: {
                    email: "", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(false);
        })

        it("should return true for valid email with subdomain", function(){
            const req = {
                body: {
                    email: "test@mail.example.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })

        it("should return true for valid email with plus addressing", function(){
            const req = {
                body: {
                    email: "test+tag@gmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })
    })

    describe("with valid complete data", function(){
        it("should return true for valid customer update data", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })

        it("should return true for minimum valid age", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 1, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })

        it("should return true for high valid age", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 150, city: "Nowhere"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })

        it("should return true even when password is present in body", function(){
            const req = {
                body: {
                    email: "test@gmail.com", name: "testUser", age: 40, city: "Nowhere", password: "shouldBeIgnored"
                }
            }
            expect(validateUpdateCustomerDetails(req)).toBe(true);
        })
    })

})