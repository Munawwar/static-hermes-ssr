/*
 * Static Hermes SSR Wrapper
 *
 * This C++ wrapper allows calling the compiled JavaScript SSR code
 * with dynamic JSON input passed as a command line argument.
 *
 * Usage: ./ssr-bin '{"counter": 42, "urlPathname": "/about"}'
 */

#include <hermes/VM/static_h.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <iostream>
#include <string>

// Native Web APIs (performance.now, crypto.getRandomValues)
#include "native-apis.h"

// The compiled JS unit is exported with this name.
// The name comes from -exported-unit flag when compiling with shermes.
// This can be configured at compile-time with -DUNIT_NAME=your_name
#ifndef UNIT_NAME
#define UNIT_NAME ssr_router
#endif

// Macro magic to create the function name
#define CONCAT_IMPL(a, b) a##b
#define CONCAT(a, b) CONCAT_IMPL(a, b)
#define EXPORT_FN(name) CONCAT(sh_export_, name)

extern "C" SHUnit *EXPORT_FN(UNIT_NAME)(void);

int main(int argc, char **argv) {
    // Check for JSON argument
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " '<json>'" << std::endl;
        std::cerr << "Example: " << argv[0] << " '{\"counter\": 42, \"urlPathname\": \"/\"}'" << std::endl;
        return 1;
    }

    const char *jsonInput = argv[1];

    // Initialize the Static Hermes runtime
    // Pass 0, nullptr to skip command line parsing for the runtime itself
    SHRuntime *shr = _sh_init(0, nullptr);
    if (!shr) {
        std::cerr << "Failed to initialize Hermes runtime" << std::endl;
        return 1;
    }

    // Get the JSI HermesRuntime interface for calling JS functions
    facebook::hermes::HermesRuntime *hermes = _sh_get_hermes_runtime(shr);
    if (!hermes) {
        std::cerr << "Failed to get HermesRuntime" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Install native Web APIs (performance.now, crypto.getRandomValues)
    hermes_ssr::installNativeAPIs(*hermes);

    // Initialize the compiled JS unit
    SHLegacyValue resultOrExc;
    if (!_sh_unit_init_guarded(shr, EXPORT_FN(UNIT_NAME), &resultOrExc)) {
        std::cerr << "Failed to initialize JS unit" << std::endl;
        _sh_done(shr);
        return 1;
    }

    try {
        // Get the renderPage function from global scope
        facebook::jsi::Function renderPage = hermes->global()
            .getPropertyAsFunction(*hermes, "renderPage");

        // Call renderPage with the JSON string argument
        facebook::jsi::Value result = renderPage.call(
            *hermes,
            facebook::jsi::String::createFromUtf8(*hermes, jsonInput)
        );

        // Get the HTML string result and print it
        if (result.isString()) {
            std::string html = result.getString(*hermes).utf8(*hermes);
            std::cout << html << std::endl;
        } else {
            std::cerr << "Error: renderPage did not return a string" << std::endl;
            _sh_done(shr);
            return 1;
        }
    } catch (const facebook::jsi::JSIException &e) {
        std::cerr << "JavaScript Error: " << e.what() << std::endl;
        _sh_done(shr);
        return 1;
    } catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Clean up
    _sh_done(shr);
    return 0;
}
