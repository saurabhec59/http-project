import {hashPassword, verifyPassword} from '../../src/auth/hash.js';

/*
hashPassword(password)
    is taking a password string as input and generating a random salt & then generating a hash using that salt & password
    And returning an object with salt & hashedPassword properties.
What can be tested:
    -> object returned should have properties 'salt' and 'hashedPassword'
    -> both properties should be strings
    -> salt should be a string of 32 characters (16 bytes in hex)
    -> salt should be unique for same password on multiple calls
    -> hashedPassword should be a string of 128 characters (64 bytes in hex)
    -> hashedPassword should be different for same password on multiple calls due to different salts
    -> should produce hash of length 128 characters for passwords with empty string and whitespaces

*/
describe("hashPassword - Password Hashing Function", function(){

    describe("return value structure", function(){
        it("should return an object with hashedPassword and salt properties", function(){
            const result = hashPassword("testPassword123");
            expect(result).toHaveProperty("hashedPassword");
            expect(result).toHaveProperty("salt");
        })

        it("should return hashedPassword as a string", function(){
            const result = hashPassword("testPassword123");
            expect(typeof result.hashedPassword).toBe("string");
        })

        it("should return salt as a string", function(){
            const result = hashPassword("testPassword123");
            expect(typeof result.salt).toBe("string");
        })
    })

    describe("salt & hash generation and uniqueness", function(){
        it("should generate a 32 character hex string for salt", function(){
            const result = hashPassword("testPassword123");
            expect(result.salt).toMatch(/^[a-f0-9]{32}$/);
            expect(result.salt.length).toBe(32);
        })

        it("should generate different salts for same password on multiple calls", function(){
            const hash1 = hashPassword("samePassword");
            const hash2 = hashPassword("samePassword");
            expect(hash1.salt).not.toBe(hash2.salt);
        })

        it("should generate a 128 character hex string for hashedPassword", function(){
            const result = hashPassword("testPassword123");
            expect(result.hashedPassword).toMatch(/^[a-f0-9]{128}$/);
            expect(result.hashedPassword.length).toBe(128);
        })

        it("should generate different hashes for same password due to different salts", function(){
            const hash1 = hashPassword("samePassword");
            const hash2 = hashPassword("samePassword");
            expect(hash1.hashedPassword).not.toBe(hash2.hashedPassword);
        })
    })

    /*describe("hash generation consistency", function(){
        it("should generate a 128 character hex string for hashedPassword", function(){
            const result = hashPassword("testPassword123");
            expect(result.hashedPassword).toMatch(/^[a-f0-9]{128}$/);
            expect(result.hashedPassword.length).toBe(128);
        })

        it("should produce same hash for same password & same salt", function(){
            const password = "testPassword";
            const firstHash = hashPassword(password);

            // Manually hash again with same salt (importing crypto for this test)
            const crypto = await import('crypto');
            const secondHashedPassword = crypto.scryptSync(password, firstHash.salt, 64).toString('hex');

            expect(secondHashedPassword).toBe(firstHash.hashedPassword);
        })
    }) */

    describe("edge cases and special inputs", function(){
        it("should handle empty string password", function(){
            const result = hashPassword("");
            expect(result.hashedPassword).toBeDefined();
            expect(result.salt).toBeDefined();
            expect(result.hashedPassword.length).toBe(128);
        })

        it("should handle password with whitespace", function(){
            const result = hashPassword("pass word with spaces");
            expect(result.hashedPassword).toBeDefined();
            expect(result.salt).toBeDefined();
            expect(result.hashedPassword.length).toBe(128);
        })
    })

})

describe("verifyPassword - Password Verification Function", function(){

    describe("correct password verification", function(){
        it("should return true for correct password", function(){
            const password = "correctPassword123";
            const { hashedPassword, salt } = hashPassword(password);
            const result = verifyPassword(password, salt, hashedPassword);
            expect(result).toBe(true);
        })
    })

    describe("incorrect password verification", function(){
        it("should return false for incorrect password", function(){
            const { hashedPassword, salt } = hashPassword("correctPassword");
            const result = verifyPassword("wrongPassword", salt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false for slightly different password", function(){
            const { hashedPassword, salt } = hashPassword("password123");
            const result = verifyPassword("password124", salt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false for case-different password", function(){
            const { hashedPassword, salt } = hashPassword("Password");
            const result = verifyPassword("password", salt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false for password with extra space", function(){
            const { hashedPassword, salt } = hashPassword("password");
            const result = verifyPassword("password ", salt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false for empty string when password was not empty", function(){
            const { hashedPassword, salt } = hashPassword("password123");
            const result = verifyPassword("", salt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false when salt is modified", function(){
            const { hashedPassword, salt } = hashPassword("password123");
            const modifiedSalt = salt.substring(0, 30) + "ff";
            const result = verifyPassword("password123", modifiedSalt, hashedPassword);
            expect(result).toBe(false);
        })

        it("should return false when hash is modified", function(){
            const password = "password123";
            const { hashedPassword, salt } = hashPassword(password);
            const modifiedHash = hashedPassword.substring(0, 126) + "ff";
            const result = verifyPassword(password, salt, modifiedHash);
            expect(result).toBe(false);
        })

    })

    describe("cross-verification between multiple hashes", function(){
        it("should verify each password with its own salt and hash correctly", function(){
            const password1 = "user1password";
            const password2 = "user2password";

            const hash1 = hashPassword(password1);
            const hash2 = hashPassword(password2);

            // Each password should verify with its own hash
            expect(verifyPassword(password1, hash1.salt, hash1.hashedPassword)).toBe(true);
            expect(verifyPassword(password2, hash2.salt, hash2.hashedPassword)).toBe(true);

            // Cross-verification should fail
            expect(verifyPassword(password1, hash2.salt, hash2.hashedPassword)).toBe(false);
            expect(verifyPassword(password2, hash1.salt, hash1.hashedPassword)).toBe(false);
        })
    })

})