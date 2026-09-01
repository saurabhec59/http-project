import {pageValidation, limitValidation, sortValidation, orderValidation} from '../../src/utils/query-parser.js';

/*
Validation Functions Testing:
1. pageValidation(value) - must be integer > 0
2. limitValidation(value) - must be integer, 0 < limit <= MAX_PAGE_LIMIT (100)
3. sortValidation(value) - must be in ALLOWED_SORTING_FIELDS ["id", "name", "email", "age", "city"]
4. orderValidation(value) - must be "asc" or "desc"

These are security-critical functions that prevent:
- Invalid pagination (runtime errors)
- SQL injection via sort fields (security)
- SQL injection via order clause (security)
*/

describe("Query Parser Validation Functions", function(){

    describe("pageValidation - Page Number Validation", function(){

        describe("valid page numbers", function(){
            it("should return true for page 1", function(){
                expect(pageValidation("1")).toBe(true);
            })

            it("should return true for page 2", function(){
                expect(pageValidation("2")).toBe(true);
            })

            it("should return true for page 100", function(){
                expect(pageValidation("100")).toBe(true);
            })

            it("should return true for large page number", function(){
                expect(pageValidation("9999")).toBe(true);
            })
        })

        describe("invalid page numbers", function(){// default page number will be chosen if this function returns false.
            it("should return false for page 0", function(){
                expect(pageValidation("0")).toBe(false);
            })

            it("should return false for negative page number", function(){
                expect(pageValidation("-1")).toBe(false);
            })

            it("should return false for float close to integer", function(){
                expect(pageValidation("2.5")).toBe(false);
            })

            it("should return false for string", function(){
                expect(pageValidation("abc")).toBe(false);
            })

            it("should return false for empty string", function(){
                expect(pageValidation("")).toBe(false);
            })

            it("should return false for string with spaces", function(){
                expect(pageValidation("1 2")).toBe(false);
            })

            it("should return false for alphanumeric string", function(){
                expect(pageValidation("page1")).toBe(false);
            })
        })

    })

    describe("limitValidation - Page Limit Validation", function(){

        describe("valid limit values", function(){
            it("should return true for limit 1", function(){
                expect(limitValidation("1")).toBe(true);
            })

            it("should return true for limit 50", function(){
                expect(limitValidation("50")).toBe(true);
            })

            it("should return true for limit equal to MAX_PAGE_LIMIT", function(){
                expect(limitValidation("100")).toBe(true);
            })

        })

        describe("invalid limit values", function(){
            it("should return false for limit 0", function(){
                expect(limitValidation("0")).toBe(false);
            })

            it("should return false for limit exceeding MAX_PAGE_LIMIT", function(){
                expect(limitValidation("101")).toBe(false);
            })

            it("should return false for decimal number", function(){
                expect(limitValidation("10.5")).toBe(false);
            })

            it("should return false for string", function(){
                expect(limitValidation("abc")).toBe(false);
            })

            it("should return false for empty string", function(){
                expect(limitValidation("")).toBe(false);
            })

        })

    })

    describe("sortValidation - Sort Field Validation (SQL Injection Prevention)", function(){

        describe("valid sort fields from whitelist", function(){
            it("should return true for sorting by id", function(){
                expect(sortValidation("id")).toBe(true);
            })

            it("should return true for sorting by name", function(){
                expect(sortValidation("name")).toBe(true);
            })

            it("should return true for sorting by email", function(){
                expect(sortValidation("email")).toBe(true);
            })

            it("should return true for sorting by age", function(){
                expect(sortValidation("age")).toBe(true);
            })

            it("should return true for sorting by city", function(){
                expect(sortValidation("city")).toBe(true);
            })
        })

        describe("invalid sort fields - security tests", function(){
            it("should return false for field not in whitelist", function(){
                expect(sortValidation("password")).toBe(false);
            })

            it("should return false for field 'role'", function(){
                expect(sortValidation("role")).toBe(false);
            })

            it("should return false for SQL injection attempt with DROP", function(){
                expect(sortValidation("id; DROP TABLE users")).toBe(false);
            })

            it("should return false for SQL injection attempt with semicolon", function(){
                expect(sortValidation("id; DELETE FROM customers")).toBe(false);
            })

            it("should return false for SQL injection with comment", function(){
                expect(sortValidation("id--")).toBe(false);
            })

            it("should return false for SQL injection with UNION", function(){
                expect(sortValidation("id UNION SELECT password")).toBe(false);
            })

            it("should return false for empty string", function(){
                expect(sortValidation("")).toBe(false);
            })

            it("should return false for case variation of valid field", function(){
                expect(sortValidation("ID")).toBe(false);
                expect(sortValidation("Name")).toBe(false);
            })

            it("should return false for field with spaces", function(){
                expect(sortValidation("id ")).toBe(false);
                expect(sortValidation(" id")).toBe(false);
            })
        })

    })

    describe("orderValidation - Sort Order Validation (SQL Injection Prevention)", function(){

        describe("valid order values", function(){
            it("should return true for asc", function(){
                expect(orderValidation("asc")).toBe(true);
            })

            it("should return true for desc", function(){
                expect(orderValidation("desc")).toBe(true);
            })
        })

        describe("invalid order values - security tests", function(){
            it("should return false for uppercase ASC", function(){
                expect(orderValidation("ASC")).toBe(false);
            })

            it("should return false for uppercase DESC", function(){
                expect(orderValidation("DESC")).toBe(false);
            })

            it("should return false for mixed case Asc", function(){
                expect(orderValidation("Asc")).toBe(false);
            })

            it("should return false for full word ascending", function(){
                expect(orderValidation("ascending")).toBe(false);
            })

            it("should return false for full word descending", function(){
                expect(orderValidation("descending")).toBe(false);
            })

            it("should return false for SQL injection attempt", function(){
                expect(orderValidation("asc; DROP TABLE users")).toBe(false);
            })

            it("should return false for empty string", function(){
                expect(orderValidation("")).toBe(false);
            })

            it("should return false for random string", function(){
                expect(orderValidation("random")).toBe(false);
            })

            it("should return false for number", function(){
                expect(orderValidation("1")).toBe(false);
            })

            it("should return false for order with spaces", function(){
                expect(orderValidation("asc ")).toBe(false);
                expect(orderValidation(" desc")).toBe(false);
            })
        })

    })

})