const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const storeData = require('./store-service');
const authData = require('./auth-service');

storeData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});