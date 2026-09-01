const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailFormat(email){
    return EMAIL_REGEX.test(email);
}

function validateUpdateCustomerDetails(req){
    // checking if all required fields are present,to update needed fields are id, email, name, age, city
    if(!(req.body && req.body.email && req.body.name && req.body.age && req.body.city)){
        return false;
    }
    // checking if all fields are of correct type // FOR EMAIL WE NEED strong check that we will implement later.
    if(typeof req.body.email !== "string" || typeof req.body.name !== "string" || typeof req.body.age !== "number" || typeof req.body.city !== "string"){
        return false;
    }
    // checking email
    if(!validateEmailFormat(req.body.email)){
        return false;
    }
    // checking max length of name & city & age > 0 && age <= 150
    if(req.body.name.length > 30 || req.body.city.length > 30 || req.body.age <= 0 || req.body.age > 150){
        return false;
    }
    // password update is not allowed in this route, so we are not checking password here.
    return true;
}

function validateCustomerDetailsHandler(req){
    // checking if all required fields are present
    if(!(req.body && req.body.email && req.body.name && req.body.age && req.body.city && req.body.password)){
        return false;
    }
    // checking if all fields are of correct type
    if(typeof req.body.email !== "string" || typeof req.body.name !== "string" || typeof req.body.age !== "number" || typeof req.body.city !== "string" || typeof req.body.password !== "string"){
        return false;
    }
    // checking email
    if(!validateEmailFormat(req.body.email)){
        return false;
    }
    // checking max length of name & city & age > 0 && age <= 150
    if(req.body.name.length > 30 || req.body.city.length > 30 || req.body.age <= 0 || req.body.age > 150){
        return false;
    }
    // checking password length
    if(req.body.password.length < 8 || req.body.password.length > 15){
        return false;
    }
    return true;
}

export { validateUpdateCustomerDetails, validateCustomerDetailsHandler, validateEmailFormat };