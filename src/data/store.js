
// creating a simple in-memory data store for users, using an array of objects. Each object represents a user with properties like id, name, and age.
var users = [
    { id: 1, name: "Rahul", age: 30},
    { id: 2, name: "John", age: 25},
]

var products = [
        { id: 1, name: "p1" },
        { id: 2, name: "p2" }
    ];

var orders = [ ];


// now implementing CRUD operations for users. Each function will perform a specific operation on the users array.
function getAll(){
    return structuredClone(users); // returning a deep copy of the users array to prevent external modifications to the original data.
}

function getById(id){
    for(var i in users){
        if(users[i].id === id){
        return structuredClone(users[i]); // returning a deep copy of the user object to prevent external modifications to the original data.
        }
    }
}

function create(data){
    var user = { id: users.length+1, name: data.name, age: data.age };
    users.push(user);
    return structuredClone(user);
}

function update(id, data){
    for(var i in users){
        if(users[i].id === id){
            users[i].name = data.name;
            users[i].age = data.age;
        }
    }
}

function deleteById(id){
    for(var i in users){
        if(users[i].id === id){
            users.splice(i, 1);
        }
    }
}

function getAllProducts(){
    return structuredClone(products);
}

function getProductById(id){
    for(var i in products){
        if(products[i].id === id){
            return structuredClone(products[i]);
        }
    }
}

function createProduct(data){
    var product = {
        id: products.length+1,
        name: data.name
    }
    products.push(product);
    return structuredClone(product);
}

function updateProduct(id, data){
    for(var i in products){
        if(products[i].id === id){
            products[i].name = data.name;
        }
    }
}

function deleteProduct(id){
    for(var i in products){
        if(products[i].id === id){
            products.splice(i, 1);
        }
    }
}

// ORDER HANDLERS ARE NOT IMPLEMENTED YET, SO JUST CREATING PLACEHOLDER FUNCTIONS FOR NOW.
function getOrderById(id){
    for(var i in orders){
        if(orders[i].id === id){
            return structuredClone(orders[i]);
        }
    }
}

function createOrder(data){
    var order = { id: orders.length+1, productId: data.productId, userId: data.userId };
    orders.push(order);
}

function deleteOrder(oId){
    for(var i in orders){
        if(orders[i].id === oId){
            orders.splice(i, 1);
        }
    }
}


export { getAll, getById, create, update, deleteById, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getOrderById, createOrder, deleteOrder };
