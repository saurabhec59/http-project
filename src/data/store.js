
// creating a simple in-memory data store for users, using an array of objects. Each object represents a user with properties like id, name, and age.
var users = [
    { id: 1, name: "Rahul", age: 30, status: "active", city: "Bangalore" },
    { id: 2, name: "John", age: 25, status: "active", city: "London" },
    { id: 3, name: "Priya", age: 28, status: "inactive", city: "Mumbai" },
    { id: 4, name: "David", age: 35, status: "active", city: "New York" },
    { id: 5, name: "Anita", age: 24, status: "active", city: "Delhi" },
    { id: 6, name: "Robert", age: 41, status: "inactive", city: "Chicago" },
    { id: 7, name: "Sneha", age: 32, status: "active", city: "Bangalore" },
    { id: 8, name: "Michael", age: 29, status: "active", city: "London" },
    { id: 9, name: "Karan", age: 38, status: "inactive", city: "Pune" },
    { id: 10, name: "Sarah", age: 27, status: "active", city: "New York" },
    { id: 11, name: "Rahul Kumar", age: 31, status: "active", city: "Hyderabad" },
    { id: 12, name: "Emily", age: 26, status: "inactive", city: "Chicago" }
];

var products = [
    { id: 1, name: "Laptop", category: "electronics", price: 800 },
    { id: 2, name: "Phone", category: "electronics", price: 600 },
    { id: 3, name: "Keyboard", category: "accessories", price: 80 },
    { id: 4, name: "Mouse", category: "accessories", price: 40 },
    { id: 5, name: "Monitor", category: "electronics", price: 300 },
    { id: 6, name: "Headphones", category: "audio", price: 120 },
    { id: 7, name: "Speaker", category: "audio", price: 150 },
    { id: 8, name: "Webcam", category: "accessories", price: 90 },
    { id: 9, name: "Tablet", category: "electronics", price: 450 },
    { id: 10, name: "Microphone", category: "audio", price: 180 },
    { id: 11, name: "Printer", category: "electronics", price: 220 },
    { id: 12, name: "USB Hub", category: "accessories", price: 35 }
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
    var user = { id: users.length+1, name: data.name, age: data.age, status: data.status, city: data.city };
    users.push(user);
    return structuredClone(user);
}

function update(id, data){
    for(var i in users){
        if(users[i].id === id){
            users[i].name = data.name;
            users[i].age = data.age;
            users[i].status = data.status;
            users[i].city = data.city;
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
        name: data.name,
        category: data.category,
        price: data.price
    }
    products.push(product);
    return structuredClone(product);
}

function updateProduct(id, data){
    for(var i in products){
        if(products[i].id === id){
            products[i].name = data.name;
            products[i].category = data.category;
            products[i].price = data.price;
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
