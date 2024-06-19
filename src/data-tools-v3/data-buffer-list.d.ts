export default DataBufferList
/**
 * A linked list of DataBuffers.
 * @property {DataBuffer} first The first DataBuffer in the list.
 * @property {DataBuffer} last The last DataBuffer in the list.
 * @property {number} totalBuffers The number of buffers in the list.
 * @property {number} availableBytes The number of bytes avaliable to read.
 * @property {number} availableBuffers The number of buffers avaliable to read.
 * @example <caption>new DataBufferList(buffers)</caption>
 * const buffer = new DataBuffer(data);
 * const list = new DataBufferList([buffer]);
 * @class
 */
declare class DataBufferList {
  /**
   * Creates an instance of DataBufferList.
   * @param {DataBuffer[]} [buffers] DataBuffers to initialize with.
   */
  constructor(buffers?: DataBuffer[])
  /** @type {DataBuffer|null} The first DataBuffer in the list. */
  first: DataBuffer | null
  /** @type {DataBuffer|null} The last DataBuffer in the list. */
  last: DataBuffer | null
  /** @type {number} The number of buffers in the list. */
  totalBuffers: number
  /** @type {number} The number of bytes avaliable to read. */
  availableBytes: number
  /** @type {number} The number of buffers avaliable to read. */
  availableBuffers: number
  /**
   * Creates a copy of the DataBufferList.
   * @returns {DataBufferList} The copied DataBufferList.
   */
  copy(): DataBufferList
  /**
   * Appends a DataBuffer to the DataBufferList.
   * @param {DataBuffer} buffer The DataBuffer to add to the list.
   * @returns {number} The new number of buffers in the DataBufferList.
   */
  append(buffer: DataBuffer): number
  /**
   * Checks if we are on the last buffer in the list.
   * @returns {boolean} Returns false if there are more buffers in the list, returns true when we are on the last buffer.
   */
  moreAvailable(): boolean
  /**
   * Advance the buffer list to the next DataBuffer or to `null` when at the end of avaliable DataBuffers.
   *
   * If there is no next buffer, the current buffer is set to null.
   * @returns {boolean} Returns false if there is no more buffers, returns true when the next buffer is set.
   */
  advance(): boolean
  /**
   * Rewind the buffer list to the previous buffer.
   * @returns {boolean} Returns false if there is no previous buffer, returns true when the previous buffer is set.
   */
  rewind(): boolean
  /**
   * Reset the list to the beginning.
   */
  reset(): void
}
import DataBuffer from './data-buffer.js'
//# sourceMappingURL=data-buffer-list.d.ts.map
