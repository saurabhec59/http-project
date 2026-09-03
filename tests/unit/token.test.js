import {generateToken, generateRefreshToken} from '../../src/auth/token.js';
import crypto from 'crypto';
//import jwt from 'jsonwebtoken';

/*
generateToken(payload)
    Takes a payload object and generates a JWT token using jwt.sign() with JWT_SECRET and TOKEN_EXPIRATION.
    Returns a JWT token string in format: HEADER.PAYLOAD.SIGNATURE (all base64url encoded).

What can be tested (focusing on OUR code, not jwt library internals):
    -> Should return a string
    -> Token should have 3 parts separated by dots (header.payload.signature)
    -> Decoded token should contain our payload
    -> Decoded token should have 'exp' claim (expiration)
    -> Decoded token should have 'iat' claim (issued at)
    -> Different tokens generated at different times should be different
    -> Should handle empty payload object
    -> Should handle payload with various data types
    -> Should use HS256 algorithm (default)
*/

//describe("generateToken - JWT Access Token Generation", function(){
//
//    describe("return value structure", function(){
//        it("should return a string", function(){
//            const token = generateToken({id: 1, role: "customer"});
//            expect(typeof token).toBe("string");
//        })
//
//        it("should return a token with 3 parts separated by dots", function(){
//            const token = generateToken({id: 1, role: "customer"});
//            const parts = token.split(".");
//            expect(parts.length).toBe(3);
//        })
//
//        it("should return a token where each part is non-empty", function(){
//            const token = generateToken({id: 1, role: "customer"});
//            const parts = token.split(".");
//            expect(parts[0].length).toBeGreaterThan(0); // header
//            expect(parts[1].length).toBeGreaterThan(0); // payload
//            expect(parts[2].length).toBeGreaterThan(0); // signature
//        })
//    })
//
//    describe("token payload verification", function(){
//        it("should contain the payload data we provided", function(){
//            const payload = {id: 123, role: "customer"};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);// decode() converts base64url encoded token to original payload object like from ejfjekekwlr to {id: 123, role: "customer", iat: 1697040000, exp: 1697068800}
//
//            expect(decoded.id).toBe(123);
//            expect(decoded.role).toBe("customer");
//        })
//
//        it("should contain 'exp' claim for expiration", function(){
//            const token = generateToken({id: 1});
//            const decoded = jwt.decode(token);
//
//            expect(decoded).toHaveProperty("exp");
//            expect(typeof decoded.exp).toBe("number");
//        })
//
//        it("should contain 'iat' claim for issued at", function(){
//            const token = generateToken({id: 1});
//            const decoded = jwt.decode(token);
//
//            expect(decoded).toHaveProperty("iat");
//            expect(typeof decoded.iat).toBe("number");
//        })
//
//        it("should set expiration approximately 1 hour from now", function(){
//            const beforeGeneration = Math.floor(Date.now() / 1000);
//            const token = generateToken({id: 1});
//            const decoded = jwt.decode(token);
//            const afterGeneration = Math.floor(Date.now() / 1000);
//
//            const expectedExpMin = beforeGeneration + 3600; // 1 hour = 3600 seconds
//            const expectedExpMax = afterGeneration + 3600;
//
//            expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpMin);
//            expect(decoded.exp).toBeLessThanOrEqual(expectedExpMax);
//        })
//
//        it("should have 'iat' approximately equal to current time", function(){
//            const beforeGeneration = Math.floor(Date.now() / 1000);
//            const token = generateToken({id: 1});
//            const decoded = jwt.decode(token);
//            const afterGeneration = Math.floor(Date.now() / 1000);
//
//            expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
//            expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
//        })
//    })
//
//    describe("token header verification", function(){
//        it("should use HS256 algorithm by default", function(){
//            const token = generateToken({id: 1});
//            const parts = token.split(".");
//            const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
//
//            expect(header.alg).toBe("HS256");
//        })
//
//        it("should have JWT type in header", function(){
//            const token = generateToken({id: 1});
//            const parts = token.split(".");
//            const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
//
//            expect(header.typ).toBe("JWT");
//        })
//    })
//
//    describe("token uniqueness and consistency", function(){
//        it("should generate different tokens for same payload due to different 'iat'", function(){
//            const payload = {id: 1, role: "customer"};
//            const token1 = generateToken(payload);
//
//            // Small delay to ensure different 'iat' timestamp
//            const delay = new Promise(resolve => setTimeout(resolve, 1000));
//            return delay.then(function(){
//                const token2 = generateToken(payload);
//                expect(token1).not.toBe(token2);
//            });
//        })
//
//        it("should generate different signatures for different payloads", function(){
//            const token1 = generateToken({id: 1});
//            const token2 = generateToken({id: 2});
//
//            const signature1 = token1.split(".")[2];
//            const signature2 = token2.split(".")[2];
//
//            expect(signature1).not.toBe(signature2);
//        })
//    })
//
//    describe("edge cases and various payload types", function(){
//        it("should handle empty payload object", function(){
//            const token = generateToken({});
//            const decoded = jwt.decode(token);
//
//            expect(decoded).toHaveProperty("exp");
//            expect(decoded).toHaveProperty("iat");
//        })
//
//        it("should handle payload with string values", function(){
//            const payload = {username: "john_doe", email: "john@example.com"};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.username).toBe("john_doe");
//            expect(decoded.email).toBe("john@example.com");
//        })
//
//        it("should handle payload with number values", function(){
//            const payload = {id: 999, age: 25};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.id).toBe(999);
//            expect(decoded.age).toBe(25);
//        })
//
//        it("should handle payload with boolean values", function(){
//            const payload = {id: 1, isAdmin: true, isActive: false};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.isAdmin).toBe(true);
//            expect(decoded.isActive).toBe(false);
//        })
//
//        it("should handle payload with nested objects", function(){
//            const payload = {id: 1, metadata: {role: "admin", department: "IT"}};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.metadata.role).toBe("admin");
//            expect(decoded.metadata.department).toBe("IT");
//        })
//
//        it("should handle payload with array values", function(){
//            const payload = {id: 1, roles: ["admin", "user"]};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.roles).toEqual(["admin", "user"]);
//        })
//
//        it("should handle payload with special characters in string values", function(){
//            const payload = {username: "user@#$%", note: "Test!@#$%^&*()"};
//            const token = generateToken(payload);
//            const decoded = jwt.decode(token);
//
//            expect(decoded.username).toBe("user@#$%");
//            expect(decoded.note).toBe("Test!@#$%^&*()");
//        })
//    })
//
//})

/*
generateRefreshToken()
    Generates a random refresh token and its SHA-256 hash.
    Returns { refreshToken, hashedRefreshToken }

Implementation:
    - Uses crypto.randomBytes(32) to generate 32 random bytes
    - Converts to hex string (32 bytes = 64 hex characters)
    - Hashes the token using SHA-256
    - SHA-256 digest in hex = 64 characters

What can be tested:
    -> Returns object with correct properties
    -> refreshToken is 64 characters (32 bytes in hex)
    -> hashedRefreshToken is 64 characters (SHA-256 hex digest)
    -> Both are hex strings
    -> Different calls produce different tokens
    -> Hash is deterministic (same input = same output)
*/

describe("generateRefreshToken - Refresh Token Generation", function(){

    describe("return value structure", function(){
        it("should return object with refreshToken and hashedRefreshToken properties", function(){
            const result = generateRefreshToken();

            expect(result).toHaveProperty("refreshToken");
            expect(result).toHaveProperty("hashedRefreshToken");
        })

        it("should return both properties as strings", function(){
            const result = generateRefreshToken();

            expect(typeof result.refreshToken).toBe("string");
            expect(typeof result.hashedRefreshToken).toBe("string");
        })
    })

    describe("refreshToken characteristics", function(){
        it("should generate refreshToken of 64 characters", function(){
            const result = generateRefreshToken();

            expect(result.refreshToken.length).toBe(64); // 32 bytes in hex = 64 chars
        })

        it("should generate refreshToken as hex string", function(){
            const result = generateRefreshToken();

            expect(result.refreshToken).toMatch(/^[a-f0-9]{64}$/);
        })

        it("should generate different refreshTokens on multiple calls", function(){
            const result1 = generateRefreshToken();
            const result2 = generateRefreshToken();

            expect(result1.refreshToken).not.toBe(result2.refreshToken);
        })
    })

    describe("hashedRefreshToken characteristics", function(){
        it("should generate hashedRefreshToken of 64 characters", function(){
            const result = generateRefreshToken();

            expect(result.hashedRefreshToken.length).toBe(64); // SHA-256 hex digest = 64 chars
        })

        it("should generate hashedRefreshToken as hex string", function(){
            const result = generateRefreshToken();

            expect(result.hashedRefreshToken).toMatch(/^[a-f0-9]{64}$/);
        })

        it("should generate different hashes for different tokens", function(){
            const result1 = generateRefreshToken();
            const result2 = generateRefreshToken();

            expect(result1.hashedRefreshToken).not.toBe(result2.hashedRefreshToken);
        })
    })

    describe("hash determinism and consistency", function(){
        it("should produce same hash for same refresh token", function(){
            const result = generateRefreshToken();

            // Manually hash the same token
            const manualHash = crypto.createHash('sha-256').update(result.refreshToken).digest('hex'); // using same hashing method as in generateRefreshToken

            expect(result.hashedRefreshToken).toBe(manualHash);
        })

        it("should produce different hash for different refresh token", function(){
            const result1 = generateRefreshToken();
            const result2 = generateRefreshToken();

            // Hash should be different because tokens are different
            expect(result1.hashedRefreshToken).not.toBe(result2.hashedRefreshToken);
        })
    })

})
