import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../../data/store.js';
import responseBuilder from '../response-builder.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError} from '../../utils/error-responses.js';
import {applyQueryParams} from '../../utils/query-handler.js';

function getAllProductsHandler(req, res){
    var products = getAllProducts();
    var result = applyQueryParams(products, req.query); // server.js already assigned parsed query params object to 'req' as 'req.query'.
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, result);
}

function getProductByIdHandler(req, res){

    var pId = parseInt(req.params.id);
    var product = getProductById(pId);
    if(!product){
        var message = notFound("Product with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, product);
}

function createProductHandler(req, res){
    var data = req.body;
    var product = createProduct(data);
    res.setHeader("Location", "/products/" + product.id);// following REST best practices, returning the location and created product in response.
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.CREATED, product);
}

function updateProductHandler(req, res){
    var product = getProductById(parseInt(req.params.id));

    if(!product){
        var message = notFound("Product with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }

    updateProduct(parseInt(req.params.id), req.body);
    // OPTIONAL sending all products list to verify product updated
    var products = getAllProducts();
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, products);
}

function deleteProductHandler(req, res){
    var product = getProductById(parseInt(req.params.id));
    if(!product){
        var message = notFound("Product with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }

    deleteProduct(parseInt(req.params.id));

    // OPTIONAL sending all Product list to verify product deleted
    var allProducts = getAllProducts();
    // Ideally should be 204 No Content, but for testing purposes we are sending the list of products after deletion
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, allProducts);
}

export { getAllProductsHandler, getProductByIdHandler, createProductHandler, updateProductHandler, deleteProductHandler };

/*

*/