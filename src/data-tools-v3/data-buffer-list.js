import DataBuffer from './data-buffer.js'

let debug = (..._) => {}
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import('debug')
    debug = d('DataBufferList')
  } catch {}
}

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
class DataBufferList {
  /**
   * Creates an instance of DataBufferList.
   * @param {DataBuffer[]} [buffers] DataBuffers to initialize with.
   */
  constructor(buffers) {
    debug('constructor')
    /** @type {DataBuffer|null} The first DataBuffer in the list. */
    this.first = null
    /** @type {DataBuffer|null} The last DataBuffer in the list. */
    this.last = null
    /** @type {number} The number of buffers in the list. */
    this.totalBuffers = 0
    /** @type {number} The number of bytes avaliable to read. */
    this.availableBytes = 0
    /** @type {number} The number of buffers avaliable to read. */
    this.availableBuffers = 0

    if (buffers && Array.isArray(buffers)) {
      for (const buffer of buffers) {
        this.append(buffer)
      }
    }
  }

  /**
   * Creates a copy of the DataBufferList.
   * @returns {DataBufferList} The copied DataBufferList.
   */
  copy() {
    debug('copy')
    const result = new DataBufferList()

    result.first = this.first
    result.last = this.last
    result.totalBuffers = this.totalBuffers
    result.availableBytes = this.availableBytes
    result.availableBuffers = this.availableBuffers

    return result
  }

  /**
   * Appends a DataBuffer to the DataBufferList.
   * @param {DataBuffer} buffer The DataBuffer to add to the list.
   * @returns {number} The new number of buffers in the DataBufferList.
   */
  append(buffer) {
    debug('append')
    buffer.prev = this.last
    if (this.last) {
      this.last.next = buffer
    }
    this.last = buffer
    if (this.first == null) {
      this.first = buffer
    }

    this.availableBytes += buffer.length
    this.availableBuffers++
    this.totalBuffers++

    debug('append:', this.totalBuffers)
    return this.totalBuffers
  }

  /**
   * Checks if we are on the last buffer in the list.
   * @returns {boolean} Returns false if there are more buffers in the list, returns true when we are on the last buffer.
   */
  moreAvailable() {
    if (this.first && this.first.next != null) {
      debug('moreAvailable: true')
      return true
    }

    debug('moreAvailable: false')
    return false
  }

  /**
   * Advance the buffer list to the next DataBuffer or to `null` when at the end of avaliable DataBuffers.
   *
   * If there is no next buffer, the current buffer is set to null.
   * @returns {boolean} Returns false if there is no more buffers, returns true when the next buffer is set.
   */
  advance() {
    debug('advance')
    if (this.first) {
      this.availableBytes -= this.first.length
      this.availableBuffers--
    }
    if (this.first && this.first.next) {
      debug('advance: advancing')
      this.first = this.first.next
      return true
    }

    debug('advance: nothing to advance to')
    this.first = null
    return false
  }

  /**
   * Rewind the buffer list to the previous buffer.
   * @returns {boolean} Returns false if there is no previous buffer, returns true when the previous buffer is set.
   */
  rewind() {
    debug('rewind')
    if (this.first && !this.first.prev) {
      return false
    }

    this.first = this.first ? this.first.prev : this.last
    if (this.first) {
      this.availableBytes += this.first.length
      this.availableBuffers++
    }

    return this.first != null
  }

  /**
   * Reset the list to the beginning.
   */
  reset() {
    debug('reset')
    while (this.rewind()) {
      continue
    }
  }
}

export default DataBufferList
