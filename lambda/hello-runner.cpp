/*
 * Minimal Static Hermes runner for Lambda
 * Takes JSON input as argv[1], calls handleRequest(), outputs result
 */

#include <hermes/VM/static_h.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <iostream>
#include <string>

#ifndef UNIT_NAME
#define UNIT_NAME hello
#endif

#define CONCAT_IMPL(a, b) a##b
#define CONCAT(a, b) CONCAT_IMPL(a, b)
#define EXPORT_FN(name) CONCAT(sh_export_, name)

extern "C" SHUnit *EXPORT_FN(UNIT_NAME)(void);

int main(int argc, char **argv) {
    const char *jsonInput = argc >= 2 ? argv[1] : "{}";

    // Initialize Static Hermes runtime
    SHRuntime *shr = _sh_init(0, nullptr);
    if (!shr) {
        std::cerr << "Failed to initialize Hermes runtime" << std::endl;
        return 1;
    }

    facebook::hermes::HermesRuntime *hermes = _sh_get_hermes_runtime(shr);
    if (!hermes) {
        std::cerr << "Failed to get HermesRuntime" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Initialize the compiled JS unit
    SHLegacyValue resultOrExc;
    if (!_sh_unit_init_guarded(shr, EXPORT_FN(UNIT_NAME), &resultOrExc)) {
        std::cerr << "Failed to initialize JS unit" << std::endl;
        _sh_done(shr);
        return 1;
    }

    try {
        // Get handleRequest function
        facebook::jsi::Function handleRequest = hermes->global()
            .getPropertyAsFunction(*hermes, "handleRequest");

        // Call with JSON input
        facebook::jsi::Value result = handleRequest.call(
            *hermes,
            facebook::jsi::String::createFromUtf8(*hermes, jsonInput)
        );

        // Output result
        if (result.isString()) {
            std::cout << result.getString(*hermes).utf8(*hermes) << std::endl;
        } else {
            std::cerr << "Error: handleRequest did not return a string" << std::endl;
            _sh_done(shr);
            return 1;
        }
    } catch (const facebook::jsi::JSIException &e) {
        std::cerr << "JavaScript Error: " << e.what() << std::endl;
        _sh_done(shr);
        return 1;
    }

    _sh_done(shr);
    return 0;
}
