/**
 * DOMException polyfill for Static Hermes SSR
 */

(function() {
  if (globalThis.DOMException && globalThis.DOMException.__polyfilled__) return;

  const errorCodes = {
    IndexSizeError: 1,
    DOMStringSizeError: 2,
    HierarchyRequestError: 3,
    WrongDocumentError: 4,
    InvalidCharacterError: 5,
    NoDataAllowedError: 6,
    NoModificationAllowedError: 7,
    NotFoundError: 8,
    NotSupportedError: 9,
    InUseAttributeError: 10,
    InvalidStateError: 11,
    SyntaxError: 12,
    InvalidModificationError: 13,
    NamespaceError: 14,
    InvalidAccessError: 15,
    ValidationError: 16,
    TypeMismatchError: 17,
    SecurityError: 18,
    NetworkError: 19,
    AbortError: 20,
    URLMismatchError: 21,
    QuotaExceededError: 22,
    TimeoutError: 23,
    InvalidNodeTypeError: 24,
    DataCloneError: 25,
    EncodingError: 0,
    NotReadableError: 0,
    UnknownError: 0,
    ConstraintError: 0,
    DataError: 0,
    TransactionInactiveError: 0,
    ReadOnlyError: 0,
    VersionError: 0,
    OperationError: 0,
    NotAllowedError: 0
  };

  class DOMException extends Error {
    static __polyfilled__ = true;

    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
      this.message = message;
      this.code = errorCodes[name] || 0;

      // Capture stack trace if available
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DOMException);
      }
    }

    // Legacy error codes as static properties
    static INDEX_SIZE_ERR = 1;
    static DOMSTRING_SIZE_ERR = 2;
    static HIERARCHY_REQUEST_ERR = 3;
    static WRONG_DOCUMENT_ERR = 4;
    static INVALID_CHARACTER_ERR = 5;
    static NO_DATA_ALLOWED_ERR = 6;
    static NO_MODIFICATION_ALLOWED_ERR = 7;
    static NOT_FOUND_ERR = 8;
    static NOT_SUPPORTED_ERR = 9;
    static INUSE_ATTRIBUTE_ERR = 10;
    static INVALID_STATE_ERR = 11;
    static SYNTAX_ERR = 12;
    static INVALID_MODIFICATION_ERR = 13;
    static NAMESPACE_ERR = 14;
    static INVALID_ACCESS_ERR = 15;
    static VALIDATION_ERR = 16;
    static TYPE_MISMATCH_ERR = 17;
    static SECURITY_ERR = 18;
    static NETWORK_ERR = 19;
    static ABORT_ERR = 20;
    static URL_MISMATCH_ERR = 21;
    static QUOTA_EXCEEDED_ERR = 22;
    static TIMEOUT_ERR = 23;
    static INVALID_NODE_TYPE_ERR = 24;
    static DATA_CLONE_ERR = 25;
  }

  globalThis.DOMException = DOMException;
})();
