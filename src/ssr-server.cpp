/*
 * Static Hermes SSR Server
 *
 * This version keeps the process alive and reads JSON from stdin,
 * allowing warm execution benchmarking without process spawn overhead.
 *
 * Usage: echo '{"counter": 42}' | ./ssr-server
 *        Or use with a pipe/socket for continuous requests
 */

#include <hermes/VM/static_h.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <iostream>
#include <string>

// Native Web APIs (performance.now, crypto.getRandomValues)
#include "native-apis.h"

// The compiled JS unit is exported with this name.
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
    // Initialize the Static Hermes runtime ONCE
    SHRuntime *shr = _sh_init(0, nullptr);
    if (!shr) {
        std::cerr << "Failed to initialize Hermes runtime" << std::endl;
        return 1;
    }

    // Get the JSI HermesRuntime interface
    facebook::hermes::HermesRuntime *hermes = _sh_get_hermes_runtime(shr);
    if (!hermes) {
        std::cerr << "Failed to get HermesRuntime" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Install native Web APIs (performance.now, crypto.getRandomValues)
    hermes_ssr::installNativeAPIs(*hermes);

    // Initialize the compiled JS unit ONCE
    SHLegacyValue resultOrExc;
    if (!_sh_unit_init_guarded(shr, EXPORT_FN(UNIT_NAME), &resultOrExc)) {
        std::cerr << "Failed to initialize JS unit" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Read JSON from stdin line by line
    std::string jsonInput;
    while (std::getline(std::cin, jsonInput)) {
        // Skip empty lines
        if (jsonInput.empty()) {
            continue;
        }

        try {
            // Get renderPage function and call it
            facebook::jsi::Function renderPage = hermes->global()
                .getPropertyAsFunction(*hermes, "renderPage");

            facebook::jsi::Value result = renderPage.call(
                *hermes,
                facebook::jsi::String::createFromUtf8(*hermes, jsonInput.c_str())
            );

            // Output the HTML result
            if (result.isString()) {
                std::string html = result.getString(*hermes).utf8(*hermes);
                std::cout << html << std::endl;
                std::cout.flush(); // Ensure immediate output
            } else {
                std::cerr << "Error: renderPage did not return a string" << std::endl;
            }
        } catch (const facebook::jsi::JSIException &e) {
            std::cerr << "JavaScript Error: " << e.what() << std::endl;
        } catch (const std::exception &e) {
            std::cerr << "Error: " << e.what() << std::endl;
        }
    }

    // Clean up when stdin closes
    _sh_done(shr);
    return 0;
}
