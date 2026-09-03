import {parseQueryString} from '../../src/utils/query-parser.js';

/*
parseQueryString(searchParams)
    Takes URLSearchParams object and returns structured query object.
    Orchestrates all validation and parsing logic.

Returns structure:
    {
        pagination: {page: 1, limit: 10},
        sorting: {sort: null, order: "asc"},
        filtering: {},
        fields: [],
        search: null,
        unknownQueryParams: {}
    }

What can be tested:
    -> Returns default values when no params provided
    -> Parses pagination params correctly
    -> Parses sorting params correctly
    -> Applies validation (invalid values fall back to defaults)
    -> Parses fields as comma-separated array
    -> Filters params go to filtering object
    -> Unknown params go to unknownQueryParams
    -> Whitelist enforcement for sort fields
*/

describe("parseQueryString - Query String Parser & Orchestrator", function(){

    describe("default values when no query params", function(){
        it("should return default structure with empty URLSearchParams", function(){
            const searchParams = new URLSearchParams("");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
            expect(result.sorting.sort).toBe(null);
            expect(result.sorting.order).toBe("asc");
            expect(result.filtering).toEqual({});
            expect(result.fields).toEqual([]);
            expect(result.search).toBe(null);
            expect(result.unknownQueryParams).toEqual({});
        })
    })

    describe("pagination parsing", function(){
        it("should parse valid page and limit", function(){
            const searchParams = new URLSearchParams("page=3&limit=25");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(3);
            expect(result.pagination.limit).toBe(25);
        })

        it("should use default page when invalid page provided", function(){
            const searchParams = new URLSearchParams("page=invalid");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(1); // default
        })

        it("should use default limit when invalid limit provided", function(){
            const searchParams = new URLSearchParams("limit=abc");
            const result = parseQueryString(searchParams);

            expect(result.pagination.limit).toBe(10); // default
        })

        it("should use default limit when limit exceeds MAX_PAGE_LIMIT", function(){
            const searchParams = new URLSearchParams("limit=500");
            const result = parseQueryString(searchParams);

            expect(result.pagination.limit).toBe(10); // default, 500 > 100
        })

        it("should accept limit equal to MAX_PAGE_LIMIT", function(){
            const searchParams = new URLSearchParams("limit=100");
            const result = parseQueryString(searchParams);

            expect(result.pagination.limit).toBe(100);
        })

        it("should use default for page=0", function(){
            const searchParams = new URLSearchParams("page=0");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(1); // default, 0 is invalid
        })
    })

    describe("sorting parsing", function(){
        it("should parse valid sort and order", function(){
            const searchParams = new URLSearchParams("sort=name&order=desc");
            const result = parseQueryString(searchParams);

            expect(result.sorting.sort).toBe("name");
            expect(result.sorting.order).toBe("desc");
        })

        it("should reject sort field not in whitelist", function(){
            const searchParams = new URLSearchParams("sort=password");
            const result = parseQueryString(searchParams);

            expect(result.sorting.sort).toBe(null); // rejected
        })

        it("should accept all whitelisted sort fields", function(){
            const whitelistedFields = ["id", "name", "email", "age", "city"];

            whitelistedFields.forEach(function(field){
                const searchParams = new URLSearchParams("sort=" + field);
                const result = parseQueryString(searchParams);
                expect(result.sorting.sort).toBe(field);
            });
        })

        it("should reject invalid order and use default", function(){
            const searchParams = new URLSearchParams("sort=name&order=random");
            const result = parseQueryString(searchParams);

            expect(result.sorting.sort).toBe("name");
            expect(result.sorting.order).toBe("asc"); // default
        })

        it("should accept both asc and desc order", function(){
            const searchParams1 = new URLSearchParams("order=asc");
            const result1 = parseQueryString(searchParams1);
            expect(result1.sorting.order).toBe("asc");

            const searchParams2 = new URLSearchParams("order=desc");
            const result2 = parseQueryString(searchParams2);
            expect(result2.sorting.order).toBe("desc");
        })
    })

    describe("fields parsing (comma-separated)", function(){
        it("should parse comma-separated fields into array", function(){
            const searchParams = new URLSearchParams("fields=id,name,email");
            const result = parseQueryString(searchParams);

            expect(result.fields).toEqual(["id", "name", "email"]);
        })

        it("should parse single field into array", function(){
            const searchParams = new URLSearchParams("fields=id");
            const result = parseQueryString(searchParams);

            expect(result.fields).toEqual(["id"]);
        })

        it("should handle fields with spaces after comma", function(){
            const searchParams = new URLSearchParams("fields=id, name, email");
            const result = parseQueryString(searchParams);

            expect(result.fields).toEqual(["id", " name", " email"]);
        })
    })

    describe("search parsing", function(){
        it("should parse search parameter", function(){
            const searchParams = new URLSearchParams("search=john");
            const result = parseQueryString(searchParams);

            expect(result.search).toBe("john");
        })

        it("should handle search with spaces", function(){
            const searchParams = new URLSearchParams("search=john doe");
            const result = parseQueryString(searchParams);

            expect(result.search).toBe("john doe");
        })
    })

    describe("filtering parameters", function(){
        it("should add whitelisted filter params to filtering object", function(){
            const searchParams = new URLSearchParams("name=John&age=25");
            const result = parseQueryString(searchParams);

            expect(result.filtering.name).toBe("John");
            expect(result.filtering.age).toBe("25");
        })

        it("should only accept whitelisted filter fields", function(){
            const searchParams = new URLSearchParams("name=John&password=secret");
            const result = parseQueryString(searchParams);

            expect(result.filtering.name).toBe("John");
            expect(result.filtering).not.toHaveProperty("password");
        })

        it("should add all whitelisted filter fields", function(){
            const searchParams = new URLSearchParams("name=John&age=25&category=electronics");
            const result = parseQueryString(searchParams);

            expect(result.filtering.name).toBe("John");
            expect(result.filtering.age).toBe("25");
            expect(result.filtering.category).toBe("electronics");
        })
    })

    describe("unknown parameters", function(){
        it("should add unknown params to unknownQueryParams", function(){
            const searchParams = new URLSearchParams("unknown=value&random=data");
            const result = parseQueryString(searchParams);

            expect(result.unknownQueryParams.unknown).toBe("value");
            expect(result.unknownQueryParams.random).toBe("data");
        })

        it("should not add known params to unknownQueryParams", function(){
            const searchParams = new URLSearchParams("page=2&limit=20&unknown=value");
            const result = parseQueryString(searchParams);

            expect(result.unknownQueryParams).not.toHaveProperty("page");
            expect(result.unknownQueryParams).not.toHaveProperty("limit");
            expect(result.unknownQueryParams.unknown).toBe("value");
        })
    })

    describe("combined query string parsing", function(){
        it("should parse complex query string with all param types", function(){
            const searchParams = new URLSearchParams("page=2&limit=50&sort=name&order=desc&name=John&search=test&fields=id,name&unknown=value");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(50);
            expect(result.sorting.sort).toBe("name");
            expect(result.sorting.order).toBe("desc");
            expect(result.filtering.name).toBe("John");
            expect(result.search).toBe("test");
            expect(result.fields).toEqual(["id", "name"]);
            expect(result.unknownQueryParams.unknown).toBe("value");
        })

        it("should handle mix of valid and invalid params", function(){
            const searchParams = new URLSearchParams("page=invalid&limit=200&sort=password&order=asc&name=John");
            const result = parseQueryString(searchParams);

            expect(result.pagination.page).toBe(1); // invalid, use default
            expect(result.pagination.limit).toBe(10); // exceeds max, use default
            expect(result.sorting.sort).toBe(null); // not in whitelist
            expect(result.sorting.order).toBe("asc"); // valid
            expect(result.filtering.name).toBe("John"); // valid
        })
    })

})