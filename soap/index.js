const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const converter = require('xml-js');

const app = express();

const SERVER_ENCODING = 'utf8';
const CONFIGURATION_FILE = "configuration.json";
const EXTENSION_WSDL = ".wsdl";
const EXTENSION_JSON = ".json";
const EXTENSION_JS = ".js";

function MockedSoapService(serverFolder, contextPath, wsdlFile, serviceName, portName, responseHeader) {
    const _contextPath = contextPath;
    const _wsdlFile = wsdlFile;
    const _serviceName = serviceName;
    const _portName = portName;
    const _responseHeader = responseHeader;

    const getWsdlFile = function () {
        return fs.readFileSync(serverFolder + '/' + _contextPath + '/' + _wsdlFile, SERVER_ENCODING);
    };

    const getServiceOperations = function () {
        const files = fs.readdirSync(serverFolder + '/' + _contextPath, SERVER_ENCODING);
        let operations = {};
        operations[_serviceName] = {};
        operations[_serviceName][_portName] = {};
        files.forEach(file => {
            if (path.extname(file) === EXTENSION_JSON) {
                console.log('INFO - adding static ' + path.parse(file).name);
                const fileContent = fs.readFileSync(serverFolder + '/' + _contextPath + '/' + file, SERVER_ENCODING);
                operations[_serviceName][_portName][path.parse(file).name] = function (args, cb, headers, req) {
                    return JSON.parse(fileContent);
                };
            } else if (path.extname(file) === EXTENSION_JS) {
                console.log('INFO - adding dynamic ' + path.parse(file).name);
                const dynamic = require('./' + _contextPath + '/' + file);
                operations[_serviceName][_portName][path.parse(file).name] = dynamic.operation;
            }
        });

        return operations;
    };

    const onStart = function () {
        console.log('INFO - initialized!');
    };

    return {
        start: function (app) {
            console.log('INFO - initializing...');

            // needed to expose xsd
            app.use(express.static(serverFolder + '/' + _contextPath));

            const server = soap.listen(app, '/' + _contextPath, getServiceOperations(), getWsdlFile(), onStart());

            if (_responseHeader) {
                server.addSoapHeader(function (methodName, args, headers, req) {
                    return _responseHeader.value
                }, '', 'tns', _responseHeader.namespace);
            }
        }
    };
}

let serverPort = -1;
let paths = [];

function init(serverFolder) {
    try {
        console.log('INFO - loading configuration from ' + serverFolder + '/' + CONFIGURATION_FILE);
        const configurationFile = fs.readFileSync(serverFolder + '/' + CONFIGURATION_FILE, SERVER_ENCODING);
        const configuration = JSON.parse(configurationFile);
        serverPort = configuration.serverPort;
        paths = configuration.paths;
    } catch(error){
        console.log('FATAL - ' + error);
        process.exit(1);
    }
}

function getWsdlFileName(files){
    for(let i = 0; i < files.length; i++) {
        if (path.extname(files[i]) === EXTENSION_WSDL) {
            return files[i];
        }
    }
}

function getSoapServiceElement(wsdlAsJson) {
    for(let i = 0; wsdlAsJson.elements.length; i++) {
        const currentElement = wsdlAsJson.elements[i];
        if(currentElement.name === 'definitions' || currentElement.name === 'wsdl:definitions'){
            for (let i = 0; currentElement.elements.length; i++) {
                const currentSubElement = currentElement.elements[i];
                if (currentSubElement.name === 'service' || currentSubElement.name === 'wsdl:service') {
                    return currentSubElement;
                }
            }
        }
    }
}

function getFirstSoapPort(soapServiceElement) {
    for(let i = 0; soapServiceElement.elements.length; i++) {
        const currentElement = soapServiceElement.elements[i];
        if (currentElement.name === 'port' || currentElement.name === 'wsdl:port') {
            return currentElement.attributes.name;
        }
    }
}

function buildService(serverFolder, service) {
    try {
        console.log('INFO - --------------------------------');
        console.log('INFO - building service ' + service.name);
        const files = fs.readdirSync(serverFolder + '/' + service.name, SERVER_ENCODING);
        const wsdlFileName = getWsdlFileName(files);
        const wsdlFile = fs.readFileSync(serverFolder + '/' + service.name + '/' + wsdlFileName, SERVER_ENCODING);
        const wsdlAsJson = JSON.parse(converter.xml2json(wsdlFile));
        const soapServiceElement = getSoapServiceElement(wsdlAsJson);
        const soapService = soapServiceElement.attributes.name;
        const soapPort = getFirstSoapPort(soapServiceElement);
        console.log('INFO - Soap service: ' + soapService);
        console.log('INFO - Soap port: ' + soapPort);

        return new MockedSoapService(serverFolder, service.name, wsdlFileName, soapService, soapPort, service.responseHeader);
    } catch(error){
        console.log('ERROR - skipping service due to: ' + error);
    }
}

function launch(serverFolder){
    init(serverFolder);

    app.listen(serverPort, function () {
        paths.forEach(service => buildService(serverFolder, service).start(app));
        console.log('INFO - --------------------------------');
        console.log('INFO - SOAP server ready on port ' + serverPort);
    });
}

exports.launch = launch;

