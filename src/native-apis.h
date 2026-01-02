/*
 * Native Web APIs for Static Hermes SSR
 *
 * Provides native implementations for APIs that require system access:
 * - performance.now() - high-resolution monotonic clock
 * - crypto.getRandomValues() - cryptographically secure random bytes
 *
 * These are injected into the JS runtime before user code runs.
 */

#ifndef NATIVE_APIS_H
#define NATIVE_APIS_H

#include <jsi/jsi.h>

#include <chrono>
#include <random>

#ifdef __linux__
#include <sys/random.h>
#elif defined(__APPLE__)
#include <Security/Security.h>
#elif defined(_WIN32)
#include <windows.h>
#include <bcrypt.h>
#pragma comment(lib, "bcrypt.lib")
#endif

namespace hermes_ssr {

using namespace facebook::jsi;

// Get high-resolution time since some epoch (monotonic clock)
static auto startTime = std::chrono::steady_clock::now();

// performance.now() implementation
static Value performanceNow(
    Runtime &rt,
    const Value &,
    const Value *,
    size_t) {
  auto now = std::chrono::steady_clock::now();
  auto duration = std::chrono::duration<double, std::milli>(now - startTime);
  return Value(duration.count());
}

// crypto.getRandomValues() implementation
static Value cryptoGetRandomValues(
    Runtime &rt,
    const Value &,
    const Value *args,
    size_t count) {
  if (count == 0) {
    throw JSError(rt, "crypto.getRandomValues requires 1 argument");
  }

  if (!args[0].isObject()) {
    throw JSError(rt, "crypto.getRandomValues requires a TypedArray argument");
  }

  Object arr = args[0].asObject(rt);

  // Get the ArrayBuffer backing the TypedArray
  if (!arr.hasProperty(rt, "buffer") || !arr.hasProperty(rt, "byteOffset") ||
      !arr.hasProperty(rt, "byteLength")) {
    throw JSError(rt, "Argument must be a TypedArray");
  }

  Value bufferVal = arr.getProperty(rt, "buffer");
  if (!bufferVal.isObject()) {
    throw JSError(rt, "Invalid TypedArray");
  }

  Object bufferObj = bufferVal.asObject(rt);
  if (!bufferObj.isArrayBuffer(rt)) {
    throw JSError(rt, "Invalid TypedArray buffer");
  }

  ArrayBuffer buffer = bufferObj.getArrayBuffer(rt);
  size_t byteOffset = static_cast<size_t>(
      arr.getProperty(rt, "byteOffset").asNumber());
  size_t byteLength = static_cast<size_t>(
      arr.getProperty(rt, "byteLength").asNumber());

  // Check for max allowed size (65536 bytes per spec)
  if (byteLength > 65536) {
    throw JSError(rt, "Quota exceeded: max 65536 bytes per call");
  }

  uint8_t *data = buffer.data(rt) + byteOffset;

  // Fill with random bytes using platform-specific secure random
#ifdef __linux__
  // Linux: use getrandom() syscall
  ssize_t result = getrandom(data, byteLength, 0);
  if (result < 0 || static_cast<size_t>(result) != byteLength) {
    throw JSError(rt, "Failed to get random bytes");
  }
#elif defined(__APPLE__)
  // macOS/iOS: use SecRandomCopyBytes
  int result = SecRandomCopyBytes(kSecRandomDefault, byteLength, data);
  if (result != errSecSuccess) {
    throw JSError(rt, "Failed to get random bytes");
  }
#elif defined(_WIN32)
  // Windows: use BCryptGenRandom
  NTSTATUS status = BCryptGenRandom(
      NULL, data, static_cast<ULONG>(byteLength), BCRYPT_USE_SYSTEM_PREFERRED_RNG);
  if (!BCRYPT_SUCCESS(status)) {
    throw JSError(rt, "Failed to get random bytes");
  }
#else
  // Fallback: use C++ random (not cryptographically secure!)
  // This should only be used for testing, not production
  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_int_distribution<> dis(0, 255);
  for (size_t i = 0; i < byteLength; i++) {
    data[i] = static_cast<uint8_t>(dis(gen));
  }
#endif

  // Return the same TypedArray (per spec)
  return Value(rt, arr);
}

// Install native APIs on the global object
inline void installNativeAPIs(Runtime &rt) {
  // Create performance object with now() method
  Object performance(rt);
  performance.setProperty(
      rt,
      "now",
      Function::createFromHostFunction(
          rt,
          PropNameID::forAscii(rt, "now"),
          0,
          performanceNow));

  // Add timeOrigin (timestamp when the runtime was created)
  auto timeOrigin = std::chrono::duration<double, std::milli>(
      std::chrono::system_clock::now().time_since_epoch());
  performance.setProperty(rt, "timeOrigin", Value(timeOrigin.count()));

  rt.global().setProperty(rt, "performance", performance);

  // Create crypto object with getRandomValues() method
  // Check if crypto already exists (it might be partially defined)
  Value existingCrypto = rt.global().getProperty(rt, "crypto");
  Object crypto = existingCrypto.isObject()
      ? existingCrypto.asObject(rt)
      : Object(rt);

  crypto.setProperty(
      rt,
      "getRandomValues",
      Function::createFromHostFunction(
          rt,
          PropNameID::forAscii(rt, "getRandomValues"),
          1,
          cryptoGetRandomValues));

  rt.global().setProperty(rt, "crypto", crypto);
}

} // namespace hermes_ssr

#endif // NATIVE_APIS_H
