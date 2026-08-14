// This Query pipeline wil expose only this function to outside handlers
function applyQueryParams(data, parsedQueryString){
    data = applyFiltering(data, parsedQueryString);// do filtering first because after filtering we will get only those records which we wants to sort, paginate and select fields from.
    data = applySorting(data, parsedQueryString);
    const totalRecord = data.length;
    data = applyPagination(data, parsedQueryString);
    data = applyFields(data, parsedQueryString);

    return {
        data: data,
        page: parsedQueryString.pagination.page,
        limit: parsedQueryString.pagination.limit,
        total: totalRecord,
        totalPages: Math.ceil(totalRecord / parsedQueryString.pagination.limit)
    }
}

function applyFiltering(data, parsedQueryString){
    for(const [key, value] of Object.entries(parsedQueryString.filtering)){
        data = data.filter(function(item){
            return String(item[key]) === String(value);
        })
    }
    return data;
}

function applyPagination(data, parsedQueryString){
    var page = parsedQueryString.pagination.page;
    var limit = parsedQueryString.pagination.limit;
    var lowerRange = (page-1)*limit;
    var upperRange = lowerRange + limit;

    return data.slice(lowerRange, upperRange);// if outerRange is greater then total records then slice() returns only available ones. And even if there are no elements then also it will return empty array [];
}

// this sorting function is suitable for only numeric fields but if you have sort by name or category etc.. then this will not work
function applySorting(data, parsedQueryString){
    var sortBy = parsedQueryString.sorting.sort;
    var order = parsedQueryString.sorting.order;

    if(sortBy === null){ return data; }
    if(order === "asc"){
        data.sort(function(a,b){
            return a[sortBy] - b[sortBy];
        })
    }
    else{
        data.sort(function(a, b){
            return b[sortBy] - a[sortBy];
        })
    }
    return data;
}

function applyFields(data, parsedQueryString) {
    var fields = parsedQueryString.fields;
    if (fields.length === 0) {
        return data;
    }

    return data.map(function (item) {

        var newItem = {};

        for (const field of fields) {
            newItem[field] = item[field];
        }

        return newItem;
    });
}

export { applyQueryParams };