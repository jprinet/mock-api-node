const _operation = function(req, resp, next) {
    resp.statusCode = 200;
    const responseAsJson = {
        hello: req.params.id
    };
    resp.json(responseAsJson);
    next();
};

exports.operation = _operation;
