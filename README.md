# mock-api-node

This project is written in Node.js with express (https://expressjs.com/) and aims to mock SOAP and REST APIs.

2 servers are mounted: 
- one with **node-soap** https://github.com/vpulim/node-soap to mock SOAP APIs
- the other with **swagger-express-middleware** (https://apitools.dev/swagger-express-middleware/) to mock REST APIs

The project is able to consume an API descriptor (yaml, wsdl), all you need to do then is to create your mocked responses as JSON files (static) or JS files (dynamic). 

By default, Soap server listens on port **8001** and REST server on port **8002** (configurable in configuration.json).

## Prerequisites

- nodeJS

## Run it!

- classic:
````shell script
npm start
````

- verbose:
````shell script
npm start debug
````

## SOAP server

all paths/files referred to in this section are in the **soap** subfolder.

### How to mock a new foobar API?

- create a *foobar* directory (*foobar* will be the context path for the API endpoint)
- copy API wsdl and xsd in it
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
- in *configuration.json*, add an entry to the paths array:
```json
{
  "name": "foobar"
} 
````

#### static mock

add a json file with the operation as filename containing the mocked response as json

#### dynamic mock

add a js file with the operation as filename containing the javascript function and export it as operation
```javascript
const _operation = function() {
    return {
        "foo": "bar"
    }
};
exports.operation = _operation;
```

### How to add a response header?

in configuration.json, add an entry to paths array with the header definition:
```json
{
  "name": "foobar",
  "responseHeader": {
    "namespace": "http://foobar.com/foobar",
    "value": {
      "foo": "bar"
    }
  }
}
```

## REST Server

all paths/files referred to in this section are in the **rest** subfolder.

### How to mock a new foobar API?

- create a *foobar* directory (*foobar* will be the context path for the API endpoint)
- copy API yaml in it
- in *configuration.json*, add an entry to the paths array:
```json
{
  "name": "foobar",
  "descriptor": "foobar.yaml"
} 
````

#### static mock

add a json file with the HTTP verb as filename (ie. **get.json**) containing the mocked response as json. 

The directory structure represents the context path of the resource.

#### dynamic mock

add a js file with the HTTP verb as filename (ie. **get.js**) containing the javascript function and export it as operation
```javascript
const _operation = function(req, resp, next) {
    resp.statusCode = 200;
    const responseAsJson = {
        hello: req.params.id
    };
    resp.json(responseAsJson);
    next();
};

exports.operation = _operation;
```

### How to handle dynamic parameters?

the folder structure may contains some __foo folders which will be converted as dynamic parameters. The value could be obtained in the callback as **req.params.foo** 

