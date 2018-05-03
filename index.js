module.exports = require('./lib/k8s');

var assert = require('assert');
var fs = require('fs');
var Client = require('node-kubernetes-client');
var request = require('request');
var express = require('express');

var app = express();
var serverPort = 3333;

client = new Client({
    host:  'akscluster-iamturner3-198f62-0edfdbb7.hcp.eastus.azmk8s.io',
    protocol: 'https',
    version: 'v1',
    // version: 'extensions/v1beta1',
    token: '3b2c213544a4da532386a44e70505210',
    namespace:  'default',
    timeout: 20000 
});

function setCORSHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "accept, content-type");
}


//======================================================================================================
app.all('/', function(req, res) {
    console.log("ROOT -----------------------")
    setCORSHeaders(res);

    res.send('Winter is Coming...');
    res.end();
});


//======================================================================================================
app.all('/list', function(req, res){
    console.log("LIST -----------------------")
    setCORSHeaders(res);
    console.log(req.url);
    console.log(req.body);

    client.version = 'v1';
    client.endpoints.get(function (err, endpoints) {
        response = []
        responseInstance = new Object()
        counter = 0;
    
        if (!err) {
            // console.log('full endpoints: ' + JSON.stringify(endpoints));
            // console.log('endpoints: ' + endpoints[0].items[1].metadata.name);
            responseInstance.name = endpoints[0].items[1].metadata.name;
            endpoints[0].items.forEach(function(endpointsItems){
                // console.log(endpointsItems.subsets[0].addresses[0].ip);
                
                endpointInstance = new Object()
                endpointsItems.subsets[0].ports.forEach(function(endpointsItemsSubsetsPorts){
                    // console.log(endpointsItemsSubsetsPorts.name);
                    // console.log(endpointsItemsSubsetsPorts.port);
                    endpointInstance[endpointsItemsSubsetsPorts.name] = endpointsItems.subsets[0].addresses[0].ip + ":" + endpointsItemsSubsetsPorts.port;
                });
                responseInstance.endpoints = endpointInstance;
            });
    
            response[counter] = responseInstance;
            console.log(JSON.stringify(response));

            res.send(JSON.stringify(response));
            res.end();
        } else {
            console.log(err);
            // assert(false);

            res.send("Error: "+err);
            res.end();
        }
    });
});


//======================================================================================================
app.all('/add', function(req, res){
    console.log("ADD -----------------------")
    setCORSHeaders(res);
    console.log(req.url);
    console.log(req.body);

    var shortid = require('shortid');
    var uniqueName = shortid.generate();

    var deploymentData = require('./data/deployments.json');
    // deploymentData.metadata.name = "minecraft-"+uniqueName.toLowerCase();
    deploymentData.spec.template.metadata.labels.app = "minecraft-"+uniqueName.toLowerCase().replace(/_/g, 'x');
    deploymentData.spec.template.spec.containers[0].name = "minecraft-"+uniqueName.toLowerCase().replace(/_/g, 'x');

    var serviceData = require('./data/services.json');
    serviceData.metadata.name = "minecraft-"+uniqueName.toLowerCase().replace(/_/g, 'x');
    serviceData.spec.selector.app = "minecraft-"+uniqueName.toLowerCase().replace(/_/g, 'x');

    // console.log(JSON.stringify(client));

    // console.log("starting service: " + serviceData.metadata.name);
    // client.version = 'v1';
    // client.services.create(serviceData, function (err, data) {
    //     if (!err) {
    //         console.log(JSON.stringify(data));

    //         res.send("done?.... ");
    //         res.end();
    //     } else {
    //         console.log("Error: " + JSON.stringify(err));
    //         // assert(false);

    //         res.send("Error: "+err);
    //         res.end();
    //     }
    // });


    console.log("starting deployment " + deploymentData.metadata.name);
    client.version = 'extensions/v1beta1';
    client.deployments = client.createCollection('deployments', null, null, { apiPrefix : 'apis', namespaced : false });

    client.deployments.create(deploymentData, function (err, data) {
    // client.deployments.update(deploymentData.metadata.name, deploymentData, function (err, data) {
        if (!err) {
            console.log(JSON.stringify(data));

            res.send("done?.... ");
            res.end();
        } else {
            console.log("Error: " + JSON.stringify(err));
            // assert(false);

            res.send("Error: "+err);
            res.end();
        }
    });


    console.log(" mmmmmm?....");
});


//======================================================================================================
// app.all('/delete', function(req, res){
//     console.log("DELETE -----------------------")
//     setCORSHeaders(res);
//     console.log(req.url);
//     console.log(req.body);

//     var testData = require('./data/minecraft.json');

//     console.log(testData.metadata.name);

//     res.send("to do......");
//     res.end();
// });


//======================================================================================================
app.listen(serverPort);
console.log("Kubernetes Client Server Started on Port " + serverPort);