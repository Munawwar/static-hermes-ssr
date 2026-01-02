/*
 * Native Web APIs for Static Hermes SSR
 *
 * Provides native implementations for APIs that require system access:
 * - performance.now() - high-resolution monotonic clock
 * - crypto.getRandomValues() - cryptographically secure random bytes
 * - crypto.subtle.digest() - SHA-1, SHA-256, SHA-384, SHA-512
 * - crypto.subtle.sign/verify() - HMAC
 *
 * These are injected into the JS runtime before user code runs.
 */

#ifndef NATIVE_APIS_H
#define NATIVE_APIS_H

#include <jsi/jsi.h>

#include <chrono>
#include <random>
#include <cstring>
#include <vector>
#include <memory>

#ifdef __linux__
#include <sys/random.h>
#if __has_include(<openssl/sha.h>)
#define HAS_OPENSSL 1
#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#endif
#elif defined(__APPLE__)
#include <Security/Security.h>
#include <CommonCrypto/CommonDigest.h>
#include <CommonCrypto/CommonHMAC.h>
#elif defined(_WIN32)
#include <windows.h>
#include <bcrypt.h>
#pragma comment(lib, "bcrypt.lib")
#endif

namespace hermes_ssr {

using namespace facebook::jsi;

// Custom MutableBuffer for creating ArrayBuffers
class VectorBuffer : public MutableBuffer {
 public:
  explicit VectorBuffer(size_t size) : data_(size, 0) {}
  explicit VectorBuffer(std::vector<uint8_t> data) : data_(std::move(data)) {}

  size_t size() const override { return data_.size(); }
  uint8_t* data() override { return data_.data(); }

 private:
  std::vector<uint8_t> data_;
};

// Helper to create an ArrayBuffer from bytes
static ArrayBuffer createArrayBufferFromBytes(Runtime &rt, const std::vector<uint8_t> &bytes) {
  auto buffer = std::make_shared<VectorBuffer>(bytes);
  return ArrayBuffer(rt, buffer);
}

static ArrayBuffer createArrayBufferWithSize(Runtime &rt, size_t size) {
  auto buffer = std::make_shared<VectorBuffer>(size);
  return ArrayBuffer(rt, buffer);
}

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

// Helper to get bytes from ArrayBuffer or TypedArray
static std::vector<uint8_t> getBytes(Runtime &rt, const Value &val) {
  if (!val.isObject()) {
    throw JSError(rt, "Expected ArrayBuffer or TypedArray");
  }

  Object obj = val.asObject(rt);

  if (obj.isArrayBuffer(rt)) {
    ArrayBuffer buf = obj.getArrayBuffer(rt);
    return std::vector<uint8_t>(buf.data(rt), buf.data(rt) + buf.size(rt));
  }

  // TypedArray - get buffer, offset, length
  if (obj.hasProperty(rt, "buffer")) {
    Value bufVal = obj.getProperty(rt, "buffer");
    if (bufVal.isObject() && bufVal.asObject(rt).isArrayBuffer(rt)) {
      ArrayBuffer buf = bufVal.asObject(rt).getArrayBuffer(rt);
      size_t offset = static_cast<size_t>(obj.getProperty(rt, "byteOffset").asNumber());
      size_t length = static_cast<size_t>(obj.getProperty(rt, "byteLength").asNumber());
      return std::vector<uint8_t>(buf.data(rt) + offset, buf.data(rt) + offset + length);
    }
  }

  throw JSError(rt, "Expected ArrayBuffer or TypedArray");
}

// crypto.subtle.digest() - returns Promise<ArrayBuffer>
static Value cryptoSubtleDigest(
    Runtime &rt,
    const Value &,
    const Value *args,
    size_t count) {
  if (count < 2) {
    throw JSError(rt, "crypto.subtle.digest requires 2 arguments");
  }

  // Get algorithm name
  std::string algorithm;
  if (args[0].isString()) {
    algorithm = args[0].asString(rt).utf8(rt);
  } else if (args[0].isObject()) {
    Object algObj = args[0].asObject(rt);
    if (algObj.hasProperty(rt, "name")) {
      algorithm = algObj.getProperty(rt, "name").asString(rt).utf8(rt);
    }
  }

  // Normalize algorithm name
  for (char &c : algorithm) c = std::toupper(c);

  // Get data bytes
  std::vector<uint8_t> data = getBytes(rt, args[1]);

  // Compute hash
  std::vector<uint8_t> hash;

#if defined(HAS_OPENSSL)
  // Linux: OpenSSL
  if (algorithm == "SHA-1") {
    hash.resize(SHA_DIGEST_LENGTH);
    SHA1(data.data(), data.size(), hash.data());
  } else if (algorithm == "SHA-256") {
    hash.resize(SHA256_DIGEST_LENGTH);
    SHA256(data.data(), data.size(), hash.data());
  } else if (algorithm == "SHA-384") {
    hash.resize(SHA384_DIGEST_LENGTH);
    SHA384(data.data(), data.size(), hash.data());
  } else if (algorithm == "SHA-512") {
    hash.resize(SHA512_DIGEST_LENGTH);
    SHA512(data.data(), data.size(), hash.data());
  } else {
    throw JSError(rt, "Unsupported algorithm: " + algorithm);
  }
#elif defined(__APPLE__)
  // macOS: CommonCrypto
  if (algorithm == "SHA-1") {
    hash.resize(CC_SHA1_DIGEST_LENGTH);
    CC_SHA1(data.data(), static_cast<CC_LONG>(data.size()), hash.data());
  } else if (algorithm == "SHA-256") {
    hash.resize(CC_SHA256_DIGEST_LENGTH);
    CC_SHA256(data.data(), static_cast<CC_LONG>(data.size()), hash.data());
  } else if (algorithm == "SHA-384") {
    hash.resize(CC_SHA384_DIGEST_LENGTH);
    CC_SHA384(data.data(), static_cast<CC_LONG>(data.size()), hash.data());
  } else if (algorithm == "SHA-512") {
    hash.resize(CC_SHA512_DIGEST_LENGTH);
    CC_SHA512(data.data(), static_cast<CC_LONG>(data.size()), hash.data());
  } else {
    throw JSError(rt, "Unsupported algorithm: " + algorithm);
  }
#else
  throw JSError(rt, "crypto.subtle.digest not supported on this platform");
#endif

  // Create ArrayBuffer with result
  ArrayBuffer result = createArrayBufferFromBytes(rt, hash);

  // Return resolved Promise (spec requires Promise)
  Value promiseConstructor = rt.global().getProperty(rt, "Promise");
  Object promiseObj = promiseConstructor.asObject(rt);
  Function resolve = promiseObj.getPropertyAsFunction(rt, "resolve");
  return resolve.call(rt, Value(rt, result));
}

// crypto.subtle.sign() for HMAC - returns Promise<ArrayBuffer>
static Value cryptoSubtleSign(
    Runtime &rt,
    const Value &,
    const Value *args,
    size_t count) {
  if (count < 3) {
    throw JSError(rt, "crypto.subtle.sign requires 3 arguments");
  }

  // Get algorithm (must be HMAC with hash)
  std::string hashAlg;
  if (args[0].isObject()) {
    Object algObj = args[0].asObject(rt);
    std::string name;
    if (algObj.hasProperty(rt, "name")) {
      name = algObj.getProperty(rt, "name").asString(rt).utf8(rt);
    }
    for (char &c : name) c = std::toupper(c);
    if (name != "HMAC") {
      throw JSError(rt, "crypto.subtle.sign only supports HMAC");
    }
    if (algObj.hasProperty(rt, "hash")) {
      Value hashVal = algObj.getProperty(rt, "hash");
      if (hashVal.isString()) {
        hashAlg = hashVal.asString(rt).utf8(rt);
      } else if (hashVal.isObject()) {
        hashAlg = hashVal.asObject(rt).getProperty(rt, "name").asString(rt).utf8(rt);
      }
    }
  }
  for (char &c : hashAlg) c = std::toupper(c);

  // Get key (CryptoKey object with raw key in _raw property)
  if (!args[1].isObject()) {
    throw JSError(rt, "Invalid key");
  }
  Object keyObj = args[1].asObject(rt);
  std::vector<uint8_t> key;
  if (keyObj.hasProperty(rt, "_raw")) {
    key = getBytes(rt, keyObj.getProperty(rt, "_raw"));
  } else {
    throw JSError(rt, "Key must have _raw property with key bytes");
  }

  // Get data
  std::vector<uint8_t> data = getBytes(rt, args[2]);

  // Compute HMAC
  std::vector<uint8_t> mac;

#if defined(HAS_OPENSSL)
  // Linux: OpenSSL HMAC
  const EVP_MD *md = nullptr;
  if (hashAlg == "SHA-1") md = EVP_sha1();
  else if (hashAlg == "SHA-256") md = EVP_sha256();
  else if (hashAlg == "SHA-384") md = EVP_sha384();
  else if (hashAlg == "SHA-512") md = EVP_sha512();
  else throw JSError(rt, "Unsupported hash: " + hashAlg);

  unsigned int macLen = 0;
  mac.resize(EVP_MAX_MD_SIZE);
  HMAC(md, key.data(), key.size(), data.data(), data.size(), mac.data(), &macLen);
  mac.resize(macLen);
#elif defined(__APPLE__)
  // macOS: CommonCrypto HMAC
  CCHmacAlgorithm alg;
  size_t digestLen;
  if (hashAlg == "SHA-1") { alg = kCCHmacAlgSHA1; digestLen = CC_SHA1_DIGEST_LENGTH; }
  else if (hashAlg == "SHA-256") { alg = kCCHmacAlgSHA256; digestLen = CC_SHA256_DIGEST_LENGTH; }
  else if (hashAlg == "SHA-384") { alg = kCCHmacAlgSHA384; digestLen = CC_SHA384_DIGEST_LENGTH; }
  else if (hashAlg == "SHA-512") { alg = kCCHmacAlgSHA512; digestLen = CC_SHA512_DIGEST_LENGTH; }
  else throw JSError(rt, "Unsupported hash: " + hashAlg);

  mac.resize(digestLen);
  CCHmac(alg, key.data(), key.size(), data.data(), data.size(), mac.data());
#else
  throw JSError(rt, "crypto.subtle.sign not supported on this platform");
#endif

  // Create ArrayBuffer with result
  ArrayBuffer result = createArrayBufferFromBytes(rt, mac);

  // Return resolved Promise
  Value promiseConstructor = rt.global().getProperty(rt, "Promise");
  Object promiseObj = promiseConstructor.asObject(rt);
  Function resolve = promiseObj.getPropertyAsFunction(rt, "resolve");
  return resolve.call(rt, Value(rt, result));
}

// crypto.subtle.importKey() - creates a CryptoKey object
static Value cryptoSubtleImportKey(
    Runtime &rt,
    const Value &,
    const Value *args,
    size_t count) {
  if (count < 5) {
    throw JSError(rt, "crypto.subtle.importKey requires 5 arguments");
  }

  // format, keyData, algorithm, extractable, keyUsages
  std::string format = args[0].asString(rt).utf8(rt);
  if (format != "raw") {
    throw JSError(rt, "Only 'raw' format supported");
  }

  std::vector<uint8_t> keyData = getBytes(rt, args[1]);

  // Create CryptoKey-like object with _raw property
  Object cryptoKey(rt);

  // Store raw key bytes in ArrayBuffer
  ArrayBuffer rawBuf = createArrayBufferFromBytes(rt, keyData);
  cryptoKey.setProperty(rt, "_raw", Value(rt, rawBuf));

  // Store algorithm info
  if (args[2].isObject()) {
    cryptoKey.setProperty(rt, "algorithm", Value(rt, args[2].asObject(rt)));
  }
  cryptoKey.setProperty(rt, "extractable", args[3]);
  cryptoKey.setProperty(rt, "type", String::createFromUtf8(rt, "secret"));

  // Return resolved Promise
  Value promiseConstructor = rt.global().getProperty(rt, "Promise");
  Object promiseObj = promiseConstructor.asObject(rt);
  Function resolve = promiseObj.getPropertyAsFunction(rt, "resolve");
  return resolve.call(rt, Value(rt, cryptoKey));
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

  // Create crypto.subtle object
  Object subtle(rt);
  subtle.setProperty(
      rt,
      "digest",
      Function::createFromHostFunction(
          rt, PropNameID::forAscii(rt, "digest"), 2, cryptoSubtleDigest));
  subtle.setProperty(
      rt,
      "sign",
      Function::createFromHostFunction(
          rt, PropNameID::forAscii(rt, "sign"), 3, cryptoSubtleSign));
  subtle.setProperty(
      rt,
      "importKey",
      Function::createFromHostFunction(
          rt, PropNameID::forAscii(rt, "importKey"), 5, cryptoSubtleImportKey));

  crypto.setProperty(rt, "subtle", subtle);

  rt.global().setProperty(rt, "crypto", crypto);
}

} // namespace hermes_ssr

#endif // NATIVE_APIS_H
