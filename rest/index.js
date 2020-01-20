const express = require('express');
const fs = require('fs');
const path = require('path');
const swagger = require('swagger-express-middleware');

const app = express();

const SERVER_ENCODING = 'utf8';
const CONFIGURATION_FILE = 'configuration.json';
const EXTENSION_JSON = '.json';
const EXTENSION_JS = '.js';

let serverPort = -1;
let validationEnabled = false;

let paths = [];

function init(serverFolder) {
    try {
        console.log('INFO - loading configuration from ' + serverFolder + '/' + CONFIGURATION_FILE);
        const configurationFile = fs.readFileSync(serverFolder + '/' + CONFIGURATION_FILE, SERVER_ENCODING);
        const configuration = JSON.parse(configurationFile);
        serverPort = configuration.serverPort;
        paths = configuration.paths;
        validationEnabled = configuration.validationEnabled;
    } catch (error) {
        console.log('FATAL - ' + error);
        process.exit(1);
    }
}

function addApi(serverFolder, apiName, cb) {
    try {
        console.log('INFO - --------------------------------');
        console.log('INFO - building API ' + apiName.name);
        console.log('INFO - initializing...');

        if (apiName.descriptor) {
            swagger(serverFolder + '/' + apiName.name + '/' + apiName.descriptor, app, function (err, middleware) {

                app.use(
                    apiName.contextPath,
                    middleware.metadata(),
                    middleware.parseRequest()
                );

                if (validationEnabled) {
                    app.use(middleware.validateRequest());
                }

                if (fs.existsSync(serverFolder + '/' + apiName.name)) {
                    overrideMock(serverFolder, apiName.name, app);
                }

                app.use(middleware.mock());
                console.log('INFO - initialized!');

                cb();
            });
        } else if (fs.existsSync(serverFolder + '/' + apiName.name)) {
            overrideMock(serverFolder, apiName.name, app);
        }
    } catch (error) {
        console.log('ERROR - skipping api due to: ' + error);
    }
}

function overrideMock(rootFolder, resourcePath, app) {
    const currentPath = rootFolder + '/' + resourcePath;
    const files = fs.readdirSync(currentPath, SERVER_ENCODING);
    for (let i = 0; i < files.length; i++) {
        if (fs.lstatSync(currentPath + '/' + files[i]).isDirectory()) {
            overrideMock(rootFolder, resourcePath + '/' + files[i], app);
        } else {
            const verb = path.parse(files[i]).name.toLowerCase();
            if (path.extname(files[i]) === EXTENSION_JSON) {
                console.log('INFO - adding static resource ' + getPathWithVariables(resourcePath) + ' on HTTP ' + verb.toUpperCase());
                const response = fs.readFileSync(rootFolder + '/' + resourcePath + '/' + files[i], SERVER_ENCODING);
                const responseAsJson = JSON.parse(response);
                app[verb]('/' + getPathWithVariables(resourcePath), function (req, res, next) {
                    return res.json(responseAsJson);
                });
            } else if (path.extname(files[i]) === EXTENSION_JS) {
                console.log('INFO - adding dynamic resource ' + getPathWithVariables(resourcePath) + ' on HTTP ' + verb.toUpperCase());
                const dynamic = require('./' + resourcePath + '/' + files[i]);
                app[verb]('/' + getPathWithVariables(resourcePath) + '/', dynamic.operation);
            }
        }
    }
}

// Windows can't have folders starting with :, hence using an __
function getPathWithVariables(path){
    return path.replace(/_+/g,':');
}

function launch(serverFolder) {
    let apisProcessed = 0;

    init(serverFolder);

    app.listen(serverPort, function () {
        paths.forEach(apiName => {
            addApi(serverFolder, apiName, function () {
                apisProcessed++;
                if(apisProcessed === paths.length) {
                    console.log('INFO - --------------------------------');
                    console.log('INFO - Rest server ready on port ' + serverPort);
                }
            });
        });
    });
}

exports.launch = launch;

