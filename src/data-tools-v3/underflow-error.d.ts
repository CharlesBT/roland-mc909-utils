export default UnderflowError
/**
 * Error thrown when insufficient bytes are avaliable to process.
 * @example <caption>new UnderflowError(message)</caption>
 * throw new UnderflowError('Insufficient Bytes: 1');
 * @augments Error
 * @class
 */
declare class UnderflowError extends Error {
  /**
   * Creates a new UnderflowError.
   * @param {string} message Message to show when the error is thrown.
   * @class
   */
  constructor(message: string)
  stack: string
}
//# sourceMappingURL=underflow-error.d.ts.map
