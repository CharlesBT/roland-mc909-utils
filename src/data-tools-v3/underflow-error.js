/**
 * Error thrown when insufficient bytes are avaliable to process.
 * @example <caption>new UnderflowError(message)</caption>
 * throw new UnderflowError('Insufficient Bytes: 1');
 * @augments Error
 * @class
 */
class UnderflowError extends Error {
  /**
   * Creates a new UnderflowError.
   * @param {string} message Message to show when the error is thrown.
   * @class
   */
  constructor(message) {
    super(message)
    this.name = 'UnderflowError'
    this.stack = new Error(message).stack
    // https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export default UnderflowError
