
// creating a simple in-memory data store for users, using an array of objects. Each object represents a user with properties like id, name, and age.
var users = [
    { id: 1, name: "Rahul", age: 30},
    { id: 2, name: "John", age: 25},
]

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

export { getAll, getById, create, update, deleteById };
