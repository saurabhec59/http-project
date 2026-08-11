// ─── Load users from GET /users and render into the table ───────────────────
function loadUsers() {
    fetch("/users")
        .then(function(response) {
            return response.json();
        })
        .then(function(users) {
            var tbody = document.getElementById("users-body");
            tbody.innerHTML = ""; // clear existing rows

            users.forEach(function(user) {
                var row = "<tr><td>" + user.id + "</td><td>" + user.name + "</td><td>" + user.age + "</td></tr>";
                tbody.innerHTML += row;
            });
        })
        .catch(function(err) {
            document.getElementById("users-body").innerHTML = "<tr><td colspan='3'>Failed to load users</td></tr>";
        });
}

// ─── Load products from GET /products and render into the table ───────────────
function loadProducts() {
    fetch("/products")
        .then(function(response) {
            return response.json();
        })
        .then(function(products) {
            var tbody = document.getElementById("products-body");
            tbody.innerHTML = "";

            products.forEach(function(product) {
                var row = "<tr><td>" + product.id + "</td><td>" + product.name + "</td></tr>";
                tbody.innerHTML += row;
            });
        })
        .catch(function(err) {
            document.getElementById("products-body").innerHTML = "<tr><td colspan='2'>Failed to load products</td></tr>";
        });
}

// ─── Handle form submit → POST /users ────────────────────────────────────────
document.getElementById("create-user-form").addEventListener("submit", function(event) {
    event.preventDefault(); // stop browser from refreshing the page on form submit

    var name = document.getElementById("name").value;
    var age  = parseInt(document.getElementById("age").value);

    fetch("/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name, age: age })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(newUser) {
        document.getElementById("form-message").textContent = "User '" + newUser.name + "' created!";
        document.getElementById("create-user-form").reset(); // clear form fields
        loadUsers(); // refresh the users table
    })
    .catch(function(err) {
        document.getElementById("form-message").textContent = "Failed to create user.";
    });
});

// ─── Run on page load ─────────────────────────────────────────────────────────
loadUsers();
loadProducts();