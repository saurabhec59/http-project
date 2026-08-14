
const allowedFilterFields = ["name", "age"]; // this wil prevent any unknown query params like ?password=420 to be stored in filtering object.

function parseQueryString(url){

    const parsedQueryString = {
        pagination: {
            page: 1,
            limit: 10
        },
        sorting: {
            sort: null,
            order: "asc"
        },
        filtering: {},
        fields: [],
        search: null,
        unknownQueryParams: {}
    }
    // read the reason of why filtering is an object and fields is an array.

    var parsedUrl = new URL(url, "http://localhost:3000");
    var params = parsedUrl.searchParams;
    for(const [key, value] of params){
        if(key === "page"){
            if(pageValidation(value)){
                parsedQueryString.pagination.page = Number(value);
            }
        }
        else if(key === "limit"){
            if(limitValidation(value)){
                parsedQueryString.pagination.limit = Number(value);
            }
        }
        else if(key === "sort"){
            if(sortValidation(value)){
                parsedQueryString.sorting.sort = value;
            }
        }
        else if(key === "order"){
            if(orderValidation(value)){
                parsedQueryString.sorting.order = value;
            }
        }
        else if(key === "fields"){// supporting comma separated format --> ?fields=id,name
            if(fieldsValidation(value)){
                var parsedFields = value.split(",");
                for(var i = 0; i<parsedFields.length; i++){
                    parsedQueryString.fields.push(parsedFields[i]); // without parsing fields array will store ["id,name,price"] and after parsing it will ["id", "name", "price"] which we wants
                }
            }
        }
        else if(key === "search"){
            if(searchValidation(value)){
                parsedQueryString.search = value;
            }
        }
        else if(allowedFilterFields.includes(key)){// rest all remaining query params will by default considered as filtering params but only after checking 'allowedFilteringParams'
            parsedQueryString.filtering[key] = value;
        }
        else{
            parsedQueryString.unknownQueryParams[key] = value; // we can decide later what to do with them
        }
    }

    return parsedQueryString;
}
export { parseQueryString };


/*
Parsing query string==>
Before that lets see about parsing URL, suppose the url is http://localhost:3000/index.html?name=Rahul&age=30&sort=price
when we do =>  new URL(req.url, "http://localhost:3000")  ==> it will return an object with properties like:
.scheme => "http"
.host => "localhost:3000"
.pathname => "/index.html"
.search => "?name=Rahul&age=30&sort=price"  => this returns query string including '?' as well.
lets see Query String ==> (?name=Rahul%20Kumar&age=30&sort=price
'&' separates parameters(key-value pairs) and '=' separates key and value. special encoding like for space '+' or '%20'
Query String may contain one parameter like: "?name=Rahul" or multiple params like: "?name=Rahul&age=30&sort=price" or no params like: "?" or even no query string at all.
It can also contain parameter with no value like: "?debug" or "?debug&name=Rahul".
HOW TO EXTRACT THE KEY:VALUES from query string?
.searchParams ==> returns an object which provides methods to extract key-values.
for ex:
===> .get()  <===
.searchParams.get("name") => "Rahul"
.searchParams.get("sort") => "price"
.searchParams.get("debug") => null  --> because this parameter has no value, only key is present and that is totally valid query string as well.
.searchParams.get("category") => null  --> because this parameter with key as 'category' is not present in query string at all.
NOTE: .searchParams.get() always returns string or null, never undefined. Also return values are always string so you need to take care of that while using it.
For ex: .searchParams.get("age") => "30" --> this is string and while using it you need to parseInt() or something else accordingly.
===> .has()  <===
it checks weather the parameter is present in query string or not. It returns boolean(true/false).
.searchParams.has("name") => true
.searchParams.has("category") => false
===> .getAll()  <=== returns an array of all values for the given parameter.
for ex:
.searchParams.getAll("name") => ["Rahul", "Kumar"]  --> if query string was "?name=Rahul&name=Kumar"
===> .set()  <===
It modifies the value of the given parameter. for ex:
.searchParams.set("phone", "12345")  ==> if query string was "?name=Rahul&age=30&phone=84848" then after this it will become "?name=Rahul&age=30&phone=12345"
===> .append()  <===
It add a new parameter (key, value) to the end of query string. for ex:
.searchParams.append("phone", "12345")  ==> if query string was "?name=Rahul&age=30" then after this it will become "?name=Rahul&age=30&phone=12345"

===> iterating over query string params <===
.searchParams --> returns an iterable in format of [key, value] pairs.
ex:
{
    ["name", "Rahul"],
    ["age", "30"],
    ["sort", "price"]
}
BUT NOT like OBJECTS ex:
{
    name: "Rahul",
    age: "30",
    sort: "price"
}
That's why we should use for..of loop instead of for..in loop to iterate over query string params. And the correct way is:
for (var [key, value] of parsedUrl.searchParams){
    console.log(key, value);
}

===> How to parse query string  <=====
Why TO PARSE query string? lets say a query string is like: "?page=2&limit=10&sort=price&order=asc&category=electronics&brand=myself&color=black&fields=id,name,price&search=phone"
This query string should be parsed to some objects to get the meaning of it. For ex: we can parse it to an object like:
{
    pagination: {
        page: 2,
        limit: 10
    },
    sorting: {
        sort: "price",
        order: "asc"
    },
    filtering: {
        category: "electronics",
        brand: "myself",
        color: "black"
    },
    fields: ["id", "name", "price"],
    search: "phone"
}
---> NOW this object represents the actual meaning and can be used by the handlers to fetch the records and return the responses.

A query string contains parameters which are nothing but [key, value] pairs. Which can contain parameters like:
Pagination parameters like : ?page=2&limit=10  ==> means return 2nd page with 10 records per page. (11-20 records)
Sorting parameters like: ?sort=price&order=asc  ==> means sort the records by price in ascending order, then return the records.
Filtering parameters like: ?category=electronics&brand=myself&color=black  ==> here 'category', 'brand', 'color' are likely to be column names of records in table.
Fields parameters like: ?fields=id,name,price  ==> means return only these fields(columns) in the response.
    Note: fields can be comma separated like ?fields=id,name,price or can be repeated like ?fields=id&fields=name&fields=price But we are using comma separated one.
Search Parameter like: ?search=phone  ==> means return all records which contains 'phone' in any of the fields(columns) of record.

*/