const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');

const app = express();

const server_encoding = 'utf8';
const SERVER_PORT = 8001;

function MockedSoapService(contextPath, wsdlFile, serviceName, portName, responseHeader, responseHeaderNamespace, dynamicOperationsModule) {
    const _contextPath = contextPath;
    const _wsdlFile = wsdlFile;
    const _serviceName = serviceName;
    const _portName = portName;
    const _responseHeader = responseHeader;
    const _responseHeaderNamespace = responseHeaderNamespace;
    const _dynamicOperationsModule = dynamicOperationsModule;

    const getWsdlFile = function () {
        return fs.readFileSync(_contextPath + '/' + _wsdlFile, server_encoding);
    };

    const getServiceOperations = function () {
        const files = fs.readdirSync(_contextPath, server_encoding);
        let operations = {};
        operations[_serviceName] = {};
        operations[_serviceName][_portName] = {};
        files.forEach(file => {
            if (path.extname(file) === '.json') {
                const fileContent = fs.readFileSync(_contextPath + '/' + file, server_encoding);
                console.log('INFO - adding static ' + path.parse(file).name);
                operations[_serviceName][_portName][path.parse(file).name] = function (args, cb, headers, req) {
                    return JSON.parse(fileContent)
                };
            }
        })
        ;

        if (_dynamicOperationsModule) {
            const dynamicOperations = require('./' + _contextPath + '/' + _dynamicOperationsModule);
            dynamicOperations.operations().forEach(operation => {
                console.log('INFO - adding dynamic ' + operation.name);
                operations[_serviceName][_portName][operation.name] = operation.value;
            })
            ;
        }

        return operations;
    };

    const onStart = function () {
        console.log('INFO - service initialized on ' + _contextPath);
    };

    return {
        start: function (app) {
            // needed to expose xsd
            app.use(express.static(_contextPath));

            const server = soap.listen(app, '/' + _contextPath, getServiceOperations(), getWsdlFile(), onStart());

            if (_responseHeader) {
                server.addSoapHeader(function (methodName, args, headers, req) {
                    return _responseHeader
                }, '', 'tns', _responseHeaderNamespace);
            }
        }
    };
}

const mockedSoapServices = [
    new MockedSoapService('hello/world', 'HelloWorldService.wsdl', 'HelloWorldService', 'HelloWorldPort')
];

app.listen(SERVER_PORT, function () {
    mockedSoapServices.forEach(service => service.start(app));
});

