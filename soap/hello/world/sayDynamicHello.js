const _operation = function() {
  return {
    greeting: "Hello " + Math.floor(Math.random() * Math.floor(1000))
  }
};

exports.operation = _operation;