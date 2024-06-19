import DataBuffer from './data-buffer.js'
import DataBufferList from './data-buffer-list.js'
import UnderflowError from './underflow-error.js'
import { float48, float80 } from './data-helpers.js'

let debug = (..._) => {}
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import('debug')
    debug = d('DataStream')
  } catch {}
}

/**
 * Helpter class to ease working with binary files.
 * @property {number} size ArrayBuffer byteLength
 * @property {ArrayBuffer} buf Instance of ArrayBuffer used for the various typed arrays
 * @property {Uint8Array} uint8 octet / uint8_t
 * @property {Int8Array} int8 byte / int8_t
 * @property {Uint16Array} uint16 unsigned short / uint16_t
 * @property {Int16Array} int16 short / int16_t
 * @property {Uint32Array} uint32 unsigned long / uint32_t
 * @property {Int32Array} int32 long / int32_t
 * @property {Float32Array} float32 unrestricted float / float
 * @property {Float64Array} float64 unrestricted double / double
 * @property {BigInt64Array} int64 bigint / int64_t (signed long long)
 * @property {BigUint64Array} uint64 bigint / uint64_t (unsigned long long)
 * @property {boolean} nativeEndian Native Endianness of the machine, true is Little Endian, false is Big Endian
 * @property {DataBufferList} list The DataBufferList to process
 * @property {number} localOffset Reading offset for the current chunk
 * @property {number} offset Reading offset for all chunks
 * @example <caption>new DataStream(list, options)</caption>
 * @class
 */
class DataStream {
  /**
   * Creates a new DataStream.
   * @param {DataBufferList} list The DataBufferList to process
   * @param {object} options Options for this instance
   * @param {number} [options.size=16] ArrayBuffer byteLength for the underlying binary parsing
   */
  constructor(list, options = {}) {
    options.size = options.size || 16
    if (options && options.size % 8 !== 0) {
      options.size += 8 - (options.size % 8)
    }
    /** @type {number} ArrayBuffer byteLength */
    this.size = options.size
    /** @type {ArrayBuffer} Instance of ArrayBuffer used for the various typed arrays */
    this.buf = new ArrayBuffer(this.size)
    /** @type {Uint8Array} octet / uint8_t */
    this.uint8 = new Uint8Array(this.buf)
    /** @type {Int8Array} byte / int8_t */
    this.int8 = new Int8Array(this.buf)
    /** @type {Uint16Array} unsigned short / uint16_t */
    this.uint16 = new Uint16Array(this.buf)
    /** @type {Int16Array} short / int16_t */
    this.int16 = new Int16Array(this.buf)
    /** @type {Uint32Array} unsigned long / uint32_t */
    this.uint32 = new Uint32Array(this.buf)
    /** @type {Int32Array} long / int32_t */
    this.int32 = new Int32Array(this.buf)
    /** @type {Float32Array} unrestricted float / float */
    this.float32 = new Float32Array(this.buf)
    /** @type {Float64Array} unrestricted double / double */
    this.float64 = new Float64Array(this.buf)
    /** @type {BigInt64Array} bigint / int64_t (signed long long) */
    this.int64 = new BigInt64Array(this.buf)
    /** @type {BigUint64Array} bigint / uint64_t (unsigned long long) */
    this.uint64 = new BigUint64Array(this.buf)

    /** @type {boolean} Native Endianness of the machine, true is Little Endian, false is Big Endian */
    this.nativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412

    /** @type {DataBufferList} The DataBufferList to process */
    this.list = list
    /** @type {number} Reading offset for the current chunk */
    this.localOffset = 0
    /** @type {number} Reading offset for all chunks */
    this.offset = 0
  }

  /**
   * Creates a new DataStream from file data.
   * @param {string | Buffer} data The data of the image to process.
   * @returns {DataStream} The new DataStream instance for the provided file data.
   * @static
   */
  static fromData(data) {
    const buffer = new DataBuffer(data)
    const list = new DataBufferList()
    list.append(buffer)
    return new DataStream(list, { size: buffer.length })
  }

  /**
   * Creates a new DataStream from a DataBuffer.
   * @param {DataBuffer} buffer The DataBuffer of the image to process.
   * @returns {DataStream} The new DataStream instance for the provided DataBuffer.
   * @static
   */
  static fromBuffer(buffer) {
    const list = new DataBufferList()
    list.append(buffer)
    return new DataStream(list, { size: buffer.length })
  }

  /**
   * Compares input data against the current data.
   * @param {DataStream} input The DataStream to compare against.
   * @param {number} [offset=0] The offset to begin comparing at.
   * @returns {boolean} True if the data is the same as the input, starting at the offset, false is there is any difference.
   */
  compare(input, offset = 0) {
    if (!input || !input.list || !input.list.availableBytes) {
      debug('compare: no input provided')
      return false
    }
    let { availableBytes } = input.list
    debug('compare', availableBytes, offset)
    if (offset) {
      availableBytes -= offset
      this.seek(offset)
      input.seek(offset)
    }
    let local
    let external
    for (let i = 0; i < availableBytes; i++) {
      local = this.readUInt8()
      external = input.readUInt8()
      if (local !== external) {
        debug('compare: first failed match at', i)
        return false
      }
      debug('compare: match at', i)
    }
    return true
  }

  /**
   * Compares input data against the upcoming data, byte by byte.
   * @param {number[] | Buffer} input The data to check for in upcoming bytes.
   * @returns {boolean} True if the data is the upcoming data, false if it is not or there is not enough buffer remaining.
   */
  next(input) {
    debug('next:', input)
    if (!input || typeof input.length !== 'number' || input.length === 0) {
      debug('next: no input provided')
      return false
    }
    if (!this.available(input.length)) {
      debug(`Insufficient Bytes: ${input.length} <= ${this.remainingBytes()}`)
      return false
    }

    debug('next: this.offset =', this.offset)
    for (let i = 0; i < input.length; i++) {
      const data = this.peekUInt8(this.offset + i)
      if (input[i] !== data) {
        debug('next: first failed match at', i, ', where:', input[i], '!==', data)
        return false
      }
    }

    return true
  }

  /**
   * Create a copy of the current DataStream and offset.
   * @returns {DataStream} A new copy of the DataStream.
   */
  copy() {
    const result = new DataStream(this.list.copy(), { size: this.size })
    result.localOffset = this.localOffset
    result.offset = this.offset
    return result
  }

  // TODO: Can `availableAt` replace `available`?
  /**
   * Checks if a given number of bytes are avaliable in the stream.
   * @param {number} bytes The number of bytes to check for.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  available(bytes) {
    return bytes <= this.remainingBytes()
  }

  /**
   * Checks if a given number of bytes are avaliable after a given offset in the stream.
   * @param {number} bytes The number of bytes to check for.
   * @param {number} offset The offset to start from.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  availableAt(bytes, offset) {
    return bytes <= this.list.availableBytes - offset
  }

  /**
   * Returns the remaining bytes in the stream.
   * @returns {number} The remaining bytes in the stream.
   */
  remainingBytes() {
    return this.list.availableBytes - this.localOffset
  }

  /**
   * Advance the stream by a given number of bytes.
   * @param {number} bytes The number of bytes to advance.
   * @returns {DataStream} The current DataStream.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  advance(bytes) {
    debug('advance:', bytes)
    if (!this.available(bytes)) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`)
    }

    this.localOffset += bytes
    this.offset += bytes

    while (
      this.list.first &&
      this.localOffset >= this.list.first.length &&
      this.list.moreAvailable()
    ) {
      debug('advance: end of the list, advancing list')
      this.localOffset -= this.list.first.length
      this.list.advance()
    }

    return this
  }

  /**
   * Rewind the stream by a given number of bytes.
   * @param {number} bytes The number of bytes to go back.
   * @returns {DataStream} The current DataStream.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  rewind(bytes) {
    if (bytes > this.offset) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`)
    }

    // If we're at the end of the bufferlist, seek from the end
    // if (!this.list.first) {
    //   this.list.rewind();
    //   this.localOffset = this.list.first.length;
    // }

    this.localOffset -= bytes
    this.offset -= bytes

    while (this.list.first.prev && this.localOffset < 0) {
      this.list.rewind()
      this.localOffset += this.list.first.length
    }

    return this
  }

  /**
   * Go to a specified offset in the stream.
   * @param {number} position The offset to go to.
   * @returns {DataStream} The current DataStream.
   */
  seek(position) {
    if (position > this.offset) {
      return this.advance(position - this.offset)
    }
    if (position < this.offset) {
      return this.rewind(this.offset - position)
    }
    return this
  }

  /**
   * Read from the current offset and return the value.
   * @returns {number} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  readUInt8() {
    if (!this.available(1)) {
      throw new UnderflowError('Insufficient Bytes: 1')
    }

    const output = this.list.first.data[this.localOffset]
    this.localOffset += 1
    this.offset += 1

    // Advance to the next item in the list if we are at the end.
    if (this.localOffset === this.list.first.length) {
      this.localOffset = 0
      this.list.advance()
    }

    return output
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  peekUInt8(offset = 0) {
    if (!this.availableAt(1, offset)) {
      throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`)
    }
    let buffer = this.list.first

    while (buffer) {
      if (buffer.length > offset) {
        return buffer.data[offset]
      }

      offset -= buffer.length
      buffer = buffer.next
    }

    return 0
  }

  /**
   * Read from the current offset and return the value.
   * @param {number} bytes The number of bytes to read.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  read(bytes, littleEndian = false) {
    // debug('read:', bytes, this.offset, littleEndian);
    if (littleEndian === this.nativeEndian) {
      for (let i = 0; i < bytes; i++) {
        this.uint8[i] = this.readUInt8()
      }
    } else {
      for (let i = bytes - 1; i >= 0; i--) {
        this.uint8[i] = this.readUInt8()
      }
    }
    // debug('read =', output.toString('hex'));
    return this.uint8.slice(0, bytes)
  }

  /**
   * Read from the provided offset and return the value.
   * @param {number} bytes The number of bytes to read.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  peek(bytes, offset = 0, littleEndian = false) {
    // debug('peek:', bytes, offset, littleEndian);
    if (littleEndian === this.nativeEndian) {
      for (let i = 0; i < bytes; i++) {
        this.uint8[i] = this.peekUInt8(offset + i)
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        this.uint8[bytes - i - 1] = this.peekUInt8(offset + i)
      }
    }
    // debug('peek =', output.toString('hex'));
    return this.uint8.slice(0, bytes)
  }

  /**
   * Read the bits from the bytes from the provided offset and return the value.
   * @param {number} position The bit position to read, 0 to 7.
   * @param {number} [length=1] The number of bits to read, 1 to 8.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The value at the provided bit position of a provided length at the provided offset.
   * @throws {Error} peekBit position is invalid: ${position}, must be an Integer between 0 and 7
   * @throws {Error} `peekBit length is invalid: ${length}, must be an Integer between 1 and 8
   */
  peekBit(position, length = 1, offset = 0) {
    // debug('peekBit:', position, length, offset);
    if (Number.isNaN(position) || !Number.isInteger(position) || position < 0 || position > 7) {
      throw new Error(
        `peekBit position is invalid: ${position}, must be an Integer between 0 and 7`,
      )
    }
    if (Number.isNaN(length) || !Number.isInteger(length) || length < 1 || length > 8) {
      throw new Error(`peekBit length is invalid: ${length}, must be an Integer between 1 and 8`)
    }
    const value = this.peekUInt8(offset)
    return ((value << position) & 0xff) >>> (8 - length)
  }

  /**
   * Read from the current offset and return the value.
   * @returns {number} The Int8 value at the current offset.
   */
  readInt8() {
    this.read(1)
    return this.int8[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The Int8 value at the current offset.
   */
  peekInt8(offset = 0) {
    this.peek(1, offset)
    return this.int8[0]
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt16 value at the current offset.
   */
  readUInt16(littleEndian) {
    this.read(2, littleEndian)
    return this.uint16[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int8 value at the current offset.
   */
  peekUInt16(offset = 0, littleEndian = false) {
    this.peek(2, offset, littleEndian)
    return this.uint16[0]
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  readInt16(littleEndian = false) {
    this.read(2, littleEndian)
    return this.int16[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  peekInt16(offset = 0, littleEndian = false) {
    this.peek(2, offset, littleEndian)
    return this.int16[0]
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt24 value at the current offset.
   */
  readUInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readUInt8() << 16)
    }
    return (this.readUInt16() << 8) + this.readUInt8()
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt24 value at the current offset.
   */
  peekUInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekUInt8(offset + 2) << 16)
    }
    return (this.peekUInt16(offset) << 8) + this.peekUInt8(offset + 2)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int24 value at the current offset.
   */
  readInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readInt8() << 16)
    }
    return (this.readInt16() << 8) + this.readUInt8()
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int24 value at the current offset.
   */
  peekInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekInt8(offset + 2) << 16)
    }
    return (this.peekInt16(offset) << 8) + this.peekUInt8(offset + 2)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt32 value at the current offset.
   */
  readUInt32(littleEndian = false) {
    this.read(4, littleEndian)
    return this.uint32[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt32 value at the current offset.
   */
  peekUInt32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian)
    return this.uint32[0]
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  readInt32(littleEndian = false) {
    this.read(4, littleEndian)
    return this.int32[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  peekInt32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian)
    return this.int32[0]
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  readFloat32(littleEndian = false) {
    this.read(4, littleEndian)
    return this.float32[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  peekFloat32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian)
    return this.float32[0]
  }

  /**
   * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the current offset.
   */
  readFloat48(littleEndian = false) {
    this.read(6, littleEndian)
    return float48(this.uint8)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the specified offset.
   */
  peekFloat48(offset, littleEndian = false) {
    this.peek(6, offset, littleEndian)
    return float48(this.uint8)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  readFloat64(littleEndian = false) {
    this.read(8, littleEndian)
    return this.float64[0]
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  peekFloat64(offset = 0, littleEndian = false) {
    this.peek(8, offset, littleEndian)
    return this.float64[0]
  }

  /**
   * Read from the current offset and return the IEEE 80 bit extended float value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float80 value at the current offset.
   */
  readFloat80(littleEndian = false) {
    this.read(10, littleEndian)
    return float80(this.uint8)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float80 value at the current offset.
   */
  peekFloat80(offset = 0, littleEndian = false) {
    this.peek(10, offset, littleEndian)
    return float80(this.uint8)
  }

  /**
   * Read from the current offset and return the value as a DataBuffer.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  readBuffer(length) {
    const to = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      to[i] = this.readUInt8()
    }
    return new DataBuffer(to)
  }

  /**
   * Read from the specified offset and return the value as a DataBuffer.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  peekBuffer(offset, length) {
    const to = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      to[i] = this.peekUInt8(offset + i)
    }
    return new DataBuffer(to)
  }

  /**
   * Read from the current offset of the current buffer for a given length and return the value as a DataBuffer.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  readSingleBuffer(length) {
    debug('readSingleBuffer:', length)
    const result = this.list.first.slice(this.localOffset, length)
    this.advance(result.length)
    return result
  }

  /**
   * Read from the specified offset of the current buffer for a given length and return the value as a DataBuffer.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  peekSingleBuffer(offset, length) {
    debug('peekSingleBuffer:', offset, length)
    return this.list.first.slice(this.localOffset + offset, length)
  }

  /**
   * Read from the current offset for a given length and return the value as a string.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  readString(length, encoding = 'ascii') {
    return this.decodeString(this.offset, length, encoding, true)
  }

  /**
   * Read from the specified offset for a given length and return the value as a string.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  peekString(offset, length, encoding = 'ascii') {
    return this.decodeString(offset, length, encoding, false)
  }

  /**
   * Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
   * Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom
   * @private
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read, if not defined it is the remaining bytes in the buffer.
   * @param {string} encoding The encoding of the string.
   * @param {boolean} advance Flag to optionally advance the offsets.
   * @returns {string} The read value as a string.
   */
  decodeString(offset, length, encoding, advance) {
    encoding = encoding.toLowerCase()
    const nullEnd = length === null ? 0 : -1

    if (!length) {
      length = this.remainingBytes()
    }

    const end = offset + length
    let result = ''

    switch (encoding) {
      case 'ascii':
      case 'latin1': {
        while (offset < end) {
          const char = this.peekUInt8(offset++)
          if (char === nullEnd) {
            break
          }
          result += String.fromCharCode(char)
        }
        break
      }
      case 'utf8':
      case 'utf-8': {
        while (offset < end) {
          const b1 = this.peekUInt8(offset++)
          if (b1 === nullEnd) {
            break
          }
          let b2
          let b3
          if ((b1 & 0x80) === 0) {
            result += String.fromCharCode(b1)
          } else if ((b1 & 0xe0) === 0xc0) {
            // one continuation (128 to 2047)
            b2 = this.peekUInt8(offset++) & 0x3f
            result += String.fromCharCode(((b1 & 0x1f) << 6) | b2)
          } else if ((b1 & 0xf0) === 0xe0) {
            // two continuation (2048 to 55295 and 57344 to 65535)
            b2 = this.peekUInt8(offset++) & 0x3f
            b3 = this.peekUInt8(offset++) & 0x3f
            result += String.fromCharCode(((b1 & 0x0f) << 12) | (b2 << 6) | b3)
          } else if ((b1 & 0xf8) === 0xf0) {
            // three continuation (65536 to 1114111)
            b2 = this.peekUInt8(offset++) & 0x3f
            b3 = this.peekUInt8(offset++) & 0x3f
            const b4 = this.peekUInt8(offset++) & 0x3f

            // split into a surrogate pair
            const pt = (((b1 & 0x0f) << 18) | (b2 << 12) | (b3 << 6) | b4) - 0x10000
            result += String.fromCharCode(0xd800 + (pt >> 10), 0xdc00 + (pt & 0x3ff))
          }
        }
        break
      }
      case 'utf16-be':
      case 'utf16be':
      case 'utf16le':
      case 'utf16-le':
      case 'utf16bom':
      case 'utf16-bom': {
        let littleEndian

        // find endianness
        switch (encoding) {
          case 'utf16be':
          case 'utf16-be': {
            littleEndian = false
            break
          }
          case 'utf16le':
          case 'utf16-le': {
            littleEndian = true
            break
          }
          case 'utf16bom':
          case 'utf16-bom':
          default: {
            const bom = this.peekUInt16(offset)
            if (length < 2 || bom === nullEnd) {
              if (advance) {
                this.advance((offset += 2))
              }
              return result
            }

            littleEndian = bom === 0xfffe
            offset += 2
            break
          }
        }

        let w1
        // eslint-disable-next-line no-cond-assign
        while (offset < end && (w1 = this.peekUInt16(offset, littleEndian)) !== nullEnd) {
          offset += 2

          if (w1 < 0xd800 || w1 > 0xdfff) {
            result += String.fromCharCode(w1)
          } else {
            const w2 = this.peekUInt16(offset, littleEndian)
            if (w2 < 0xdc00 || w2 > 0xdfff) {
              throw new Error('Invalid utf16 sequence.')
            }

            result += String.fromCharCode(w1, w2)
            offset += 2
          }
        }

        if (w1 === nullEnd) {
          offset += 2
        }
        break
      }
      default: {
        throw new Error(`Unknown encoding: ${encoding}`)
      }
    }

    if (advance) {
      this.advance(length)
    }
    return result
  }

  /**
   * Resets the instance offsets to 0.
   * @memberof DataStream
   */
  reset() {
    this.localOffset = 0
    this.offset = 0
  }
}

export default DataStream
