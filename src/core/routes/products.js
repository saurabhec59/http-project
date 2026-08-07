import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../../data/store.js';
import responseBuilder from '../response-builder.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError} from '../../utils/error-responses.js';

function getAllProductsHandler(req, res){
    var products = getAllProducts();
    responseBuilder.sendJsonResponse(res, products);
}

function getProductByIdHandler(req, res){

    var pId = parseInt(req.params.id);
    var product = getProductById(pId);
    if(!product){
        var html = "<h2>Product not found</h2>";
        responseBuilder.send404Response(res, html);
        return;
    }
    responseBuilder.sendJsonResponse(res, product);
}

function createProductHandler(req, res){
    var data = req.body;
    createProduct(data);
    // OPTIONAL sending all products list to verify product created
    var products = getAllProducts();
    res.statusCode = STATUS_CODES.CREATED;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(products));
    res.end();
}

function updateProductHandler(req, res){
    var product = getProductById(parseInt(req.params.id));

    if(!product){
        var html = "<h2>Product not found</h2>";
        responseBuilder.send404Response(res, html);
        return;
    }

    updateProduct(parseInt(req.params.id), req.body);
    // OPTIONAL sending all products list to verify product updated
    var products = getAllProducts();
    res.statusCode = STATUS_CODES.OK;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(products));
    res.end();
}

function deleteProductHandler(req, res){
    var product = getProductById(parseInt(req.params.id));
    if(!product){
        var html = "<h2>Product not found</h2>";
        responseBuilder.send404Response(res, html);
        return;
    }

    deleteProduct(parseInt(req.params.id));

    // OPTIONAL sending all Product list to verify product deleted
    var allProducts = getAllProducts();
    res.statusCode = STATUS_CODES.OK; // Ideally should be 204 No Content, but for testing purposes we are sending the list of products after deletion
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(allProducts));
    res.end();
}

export { getAllProductsHandler, getProductByIdHandler, createProductHandler, updateProductHandler, deleteProductHandler };

/*

*/