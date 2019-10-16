const _operations = [];

exports.addDynamicService = function (name, value) {
    _operations.push({
        name: name,
        value: value
    });
};

exports.operations = _operations;
