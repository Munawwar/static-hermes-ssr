// Minimal hello world for Lambda cold start benchmark
// This gets compiled to native binary via Static Hermes

// Global function that the C++ wrapper calls
globalThis.handleRequest = function(jsonInput) {
  // Parse input (Lambda event)
  var event = JSON.parse(jsonInput);

  // Return hello world response
  return JSON.stringify({
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, World!" })
  });
};
