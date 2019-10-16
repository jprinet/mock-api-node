# mock-soap

Mount a nodeJS server (express) with node-soap https://github.com/vpulim/node-soap in order to mock SOAP API(s).
The server listens on port **8001**.

## Prerequisites

- nodeJS v8 and later (ECMAScript 6)

## Run it!

- classic:
````shell script
npm start
````

- verbose:
````shell script
npm start debug
````

## How to mock a new foobar API?

- create a *foobar* directory (*foobar* will be the context path for the API endpoint)
- copy API wsdl and xsd in it
- for each operation add a json file with the operation as filename containing the mocked response as json
- if the wsdl contains an xsd:import directive, prefix the schema location with the current mocked server url
```xml
<xsd:schema>
    <xsd:import namespace="http://foobar.com/foobar" schemaLocation="http://localhost:8001/foobar.xsd"/>
</xsd:schema>
```
- update the endpoint location to point to the mocked server 
```xml
<soap:address location="http://localhost:8001/foobar"/>
```
- in *index.js*, add a *MockedSoapService* instance to the *mockedSoapServices* variable representing the *foobar API*

## How to add a response header?

fill the *responseHeader* and *responseHeaderNamespace* parameters of the *MockedSoapService* constructor. 

## How to add dynamic responses?

- create - inside the API folder - a new module as follow:
````javascript
const dynamic = require('../../dynamic-service.js');

dynamic.addDynamicService('myDynamicOperation', function() {
    return {
        myDynamicResult: {
            myId: Math.floor(Math.random() * Math.floor(1000))
        }
    }
});

exports.operations =  function () {
    return dynamic.operations;
};
````
- fill the *dynamicOperationsModule* parameter of the *MockedSoapService* constructor with the name of the previously created module.

## TODO

- Error handling
