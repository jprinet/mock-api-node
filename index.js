const REST_SERVER_FOLDER = 'rest';
const SOAP_SERVER_FOLDER = 'soap';
const SERVER_INDEX = 'index.js';

const restServer = require('./' + REST_SERVER_FOLDER + '/' + SERVER_INDEX);
const soapServer = require('./' + SOAP_SERVER_FOLDER + '/' + SERVER_INDEX);

restServer.launch(REST_SERVER_FOLDER);

soapServer.launch(SOAP_SERVER_FOLDER);
