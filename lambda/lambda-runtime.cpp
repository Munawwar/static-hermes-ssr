/*
 * Native Lambda Runtime for Static Hermes
 * Implements AWS Lambda Runtime API directly in C++ - no bash, no curl
 */

#include <hermes/VM/static_h.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <iostream>
#include <string>
#include <cstring>
#include <cstdlib>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>

#ifndef UNIT_NAME
#define UNIT_NAME hello
#endif

#define CONCAT_IMPL(a, b) a##b
#define CONCAT(a, b) CONCAT_IMPL(a, b)
#define EXPORT_FN(name) CONCAT(sh_export_, name)

extern "C" SHUnit *EXPORT_FN(UNIT_NAME)(void);

// Simple HTTP client for Lambda Runtime API
class LambdaRuntime {
private:
    std::string host_;
    int port_;

    int connectToApi() {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) return -1;

        struct hostent *server = gethostbyname(host_.c_str());
        if (!server) {
            close(sock);
            return -1;
        }

        struct sockaddr_in addr;
        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        memcpy(&addr.sin_addr.s_addr, server->h_addr, server->h_length);
        addr.sin_port = htons(port_);

        if (connect(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
            close(sock);
            return -1;
        }

        return sock;
    }

    std::string readResponse(int sock, std::string &requestId) {
        char buffer[65536];
        std::string response;
        ssize_t n;

        // Read all data
        while ((n = recv(sock, buffer, sizeof(buffer) - 1, 0)) > 0) {
            buffer[n] = '\0';
            response += buffer;

            // Check if we have complete response (Content-Length based)
            size_t headerEnd = response.find("\r\n\r\n");
            if (headerEnd != std::string::npos) {
                // Parse Content-Length
                size_t clPos = response.find("Content-Length: ");
                if (clPos != std::string::npos) {
                    size_t clEnd = response.find("\r\n", clPos);
                    int contentLength = std::stoi(response.substr(clPos + 16, clEnd - clPos - 16));
                    size_t bodyStart = headerEnd + 4;
                    if (response.length() >= bodyStart + contentLength) {
                        break;
                    }
                }
            }
        }

        // Extract request ID from headers
        std::string ridHeader = "Lambda-Runtime-Aws-Request-Id: ";
        size_t ridPos = response.find(ridHeader);
        if (ridPos != std::string::npos) {
            size_t ridEnd = response.find("\r\n", ridPos);
            requestId = response.substr(ridPos + ridHeader.length(), ridEnd - ridPos - ridHeader.length());
        }

        // Extract body
        size_t bodyPos = response.find("\r\n\r\n");
        if (bodyPos != std::string::npos) {
            return response.substr(bodyPos + 4);
        }
        return "";
    }

public:
    LambdaRuntime() {
        const char *api = getenv("AWS_LAMBDA_RUNTIME_API");
        if (!api) {
            std::cerr << "AWS_LAMBDA_RUNTIME_API not set" << std::endl;
            exit(1);
        }

        std::string apiStr(api);
        size_t colonPos = apiStr.find(':');
        if (colonPos != std::string::npos) {
            host_ = apiStr.substr(0, colonPos);
            port_ = std::stoi(apiStr.substr(colonPos + 1));
        } else {
            host_ = apiStr;
            port_ = 80;
        }
    }

    std::string getNextInvocation(std::string &requestId) {
        int sock = connectToApi();
        if (sock < 0) return "";

        std::string request = "GET /2018-06-01/runtime/invocation/next HTTP/1.1\r\n"
                              "Host: " + host_ + "\r\n"
                              "Connection: close\r\n"
                              "\r\n";

        send(sock, request.c_str(), request.length(), 0);
        std::string body = readResponse(sock, requestId);
        close(sock);
        return body;
    }

    void sendResponse(const std::string &requestId, const std::string &response) {
        int sock = connectToApi();
        if (sock < 0) return;

        std::string request = "POST /2018-06-01/runtime/invocation/" + requestId + "/response HTTP/1.1\r\n"
                              "Host: " + host_ + "\r\n"
                              "Content-Type: application/json\r\n"
                              "Content-Length: " + std::to_string(response.length()) + "\r\n"
                              "Connection: close\r\n"
                              "\r\n" + response;

        send(sock, request.c_str(), request.length(), 0);

        // Read response (we don't really need it, but should drain the socket)
        char buffer[1024];
        while (recv(sock, buffer, sizeof(buffer), 0) > 0) {}
        close(sock);
    }

    void sendError(const std::string &requestId, const std::string &errorType, const std::string &errorMessage) {
        int sock = connectToApi();
        if (sock < 0) return;

        std::string errorBody = "{\"errorType\":\"" + errorType + "\",\"errorMessage\":\"" + errorMessage + "\"}";
        std::string request = "POST /2018-06-01/runtime/invocation/" + requestId + "/error HTTP/1.1\r\n"
                              "Host: " + host_ + "\r\n"
                              "Content-Type: application/json\r\n"
                              "Content-Length: " + std::to_string(errorBody.length()) + "\r\n"
                              "Connection: close\r\n"
                              "\r\n" + errorBody;

        send(sock, request.c_str(), request.length(), 0);

        char buffer[1024];
        while (recv(sock, buffer, sizeof(buffer), 0) > 0) {}
        close(sock);
    }
};

int main() {
    // Initialize Static Hermes runtime ONCE at startup (cold start)
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

    // Initialize Lambda Runtime API client
    LambdaRuntime runtime;

    // Event loop - handle invocations
    while (true) {
        std::string requestId;
        std::string event = runtime.getNextInvocation(requestId);

        if (requestId.empty()) {
            std::cerr << "Failed to get request ID" << std::endl;
            continue;
        }

        try {
            // Get and call JS handleRequest function
            facebook::jsi::Value result = hermes->global()
                .getPropertyAsFunction(*hermes, "handleRequest")
                .call(*hermes, facebook::jsi::String::createFromUtf8(*hermes, event));

            if (result.isString()) {
                std::string response = result.getString(*hermes).utf8(*hermes);
                runtime.sendResponse(requestId, response);
            } else {
                runtime.sendError(requestId, "InvalidResponse", "handleRequest did not return a string");
            }
        } catch (const facebook::jsi::JSIException &e) {
            runtime.sendError(requestId, "JavaScriptError", e.what());
        } catch (const std::exception &e) {
            runtime.sendError(requestId, "RuntimeError", e.what());
        }
    }

    _sh_done(shr);
    return 0;
}
