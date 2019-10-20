# mock-soap

Mount a nodeJS mock server (express) with node-soap (https://github.com/vpulim/node-soap) to fake third party APIs.

The server listens on port **8001** (configurable in configuration.json).

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

## How to mock a new foobar API?

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
```javascript
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

## How to add a response header?

in configuration.json, add an entry to paths array with the header definition:
```javascript
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
