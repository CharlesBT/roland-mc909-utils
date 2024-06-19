import UnderflowError from './underflow-error.js'
import { float48, float80 } from './data-helpers.js'

let debug = (..._) => {}
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import('debug')
    debug = d('DataBuffer')
  } catch {}
}

/**
 * Helper class for manipulating binary data.
 * @property {Buffer|Uint8Array} data The data to process.
 * @property {number} length The size of the data in bytes.
 * @property {DataBuffer} next The next DataBuffer when part of a DataBufferList.
 * @property {DataBuffer} prev The previous DataBuffer when part of a DataBufferList.
 * @example <caption>new DataBuffer(stream)</caption>
 * const buffer = new DataBuffer(new Uint8Array([0xFC, 0x08]));
 * buffer.readUInt8();
 * ➜ 0xFC
 * buffer.readUInt8();
 * ➜ 0x08
 * @class
 */
class DataBuffer {
  /**
   * Creates an instance of DataBuffer.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} [input] The data to process.
   * @throws {TypeError} Missing input data.
   * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
   */
  constructor(input) {
    /** @type {boolean} Is this instance for creating a new file? */
    this.writing = false

    /** @type {number[]|Buffer|Uint8Array} The bytes avaliable to read. */
    this.data = []
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
      debug('constructor: from Buffer')
      this.data = Buffer.from(input)
    } else if (typeof input === 'string') {
      debug('constructor: from string')
      this.data = Buffer.from(input)
    } else if (input instanceof Uint8Array) {
      debug('constructor: from Uint8Array')
      this.data = input
    } else if (input instanceof ArrayBuffer) {
      debug('constructor: from ArrayBuffer')
      this.data = new Uint8Array(input)
    } else if (Array.isArray(input)) {
      debug('constructor: Normal Array')
      this.data = new Uint8Array(input)
    } else if (typeof input === 'number') {
      debug('constructor: Number (i.e. length)')
      this.data = new Uint8Array(input)
    } else if (input instanceof DataBuffer) {
      debug('constructor: from DataBuffer, a shallow copy')
      this.data = input.data
    } else if (input && input.buffer && input.buffer instanceof ArrayBuffer) {
      debug('constructor: from typed arrays other than Uint8Array')
      this.data = new Uint8Array(
        input.buffer,
        input.byteOffset,
        input.length * input.BYTES_PER_ELEMENT,
      )
    } else if (typeof input === 'undefined') {
      debug('constructor: empty, creating a new file from scratch')
      this.writing = true
      this.data = new Uint8Array()
    } else {
      const error = `Unknown type of input for DataBuffer: ${typeof input}`
      debug(error)
      throw new TypeError(error)
    }

    /** @type {number} The number of bytes avaliable to read. */
    // this.length = this.data.length;

    // Used when the buffer is part of a bufferlist
    /** @type {DataBuffer|null} The next DataBuffer in the list. */
    this.next = null
    /** @type {DataBuffer|null} The previous DataBuffer in the list. */
    this.prev = null

    /** @type {boolean} Native Endianness of the machine, true is Little Endian, false is Big Endian */
    this.nativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412

    /** @type {number} Reading / Writing offset */
    this.offset = 0

    /** @type {number[]} Buffer for creating new files. */
    this.buffer = [...this.data]
  }

  /**
   * Creates an instance of DataBuffer with given size.
   * @param {number} size The size of the requested DataBuffer.
   * @returns {DataBuffer} The new DataBuffer.
   */
  static allocate(size) {
    debug('DataBuffer.allocate:', size)
    return new DataBuffer(size)
  }

  /**
   * Helper to match arrays by returning the data length.
   * @returns {number} The data length of the DataBuffer.
   */
  get length() {
    return this.data.length
  }

  /**
   * Compares another DataBuffer against the current data buffer at a specified offset.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} input The size of the requested DataBuffer.
   * @param {number} [offset=0] The size of the requested DataBuffer.
   * @returns {boolean} Returns true when both DataBuffers are equal, false if there is any difference.
   */
  compare(input, offset = 0) {
    // debug('compare:', input.length, offset);
    const buffer = new DataBuffer(input)
    const { length } = buffer
    if (!length) {
      debug('compare: no input provided')
      return false
    }
    const local = this.slice(offset, length)
    const { data } = buffer
    for (let i = 0; i < length; i++) {
      if (local.data[i] !== data[i]) {
        debug('compare: first failed match at', i)
        return false
      }
    }
    debug('compare: data is the same')
    return true
  }

  /**
   * Creates a copy of the current DataBuffer.
   * @returns {DataBuffer} A new copy of the current DataBuffer.
   */
  copy() {
    debug('copy')
    return new DataBuffer(new Uint8Array(this.data.slice(0)))
  }

  /**
   * Creates a copy of the current DataBuffer from a specified offset and a specified length.
   * @param {number} position The starting offset to begin the copy of the new DataBuffer.
   * @param {number} [length=this.length] The size of the new DataBuffer.
   * @returns {DataBuffer} The new DataBuffer
   */
  slice(position, length = this.length) {
    debug('slice:', position, length)
    if (position === 0 && length >= this.length) {
      return new DataBuffer(this.data)
    }
    // `subarray` returns a new typed array copy on the same ArrayBuffer,
    // `slice`  returns a new typed array (with a new underlying buffer).
    return new DataBuffer(this.data.slice(position, position + length))
  }

  /**
   * Returns the remaining bytes to be read in the DataBuffer.
   * @returns {number} The remaining bytes to bre read in the DataBuffer.
   */
  remainingBytes() {
    return this.length - this.offset
  }

  /**
   * Checks if a given number of bytes are avaliable in the DataBuffer.
   * If writing mode is enabled, this is always true.
   * @param {number} bytes The number of bytes to check for.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the DataBuffer.
   */
  available(bytes) {
    return this.writing || bytes <= this.remainingBytes()
  }

  /**
   * Checks if a given number of bytes are avaliable after a given offset in the buffer.
   * If writing mode is enabled, this is always true.
   * @param {number} bytes The number of bytes to check for.
   * @param {number} offset The offset to start from.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  availableAt(bytes, offset) {
    return this.writing || bytes <= this.length - offset
  }

  /**
   * Advance the offset by a given number of bytes.
   * @param {number} bytes The number of bytes to advance.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  advance(bytes) {
    debug('advance:', bytes)
    if (!this.available(bytes)) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`)
    }
    this.offset += bytes
    debug('advance: offset', this.offset)
  }

  /**
   * Rewind the offset by a given number of bytes.
   * @param {number} bytes The number of bytes to go back.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  rewind(bytes) {
    debug('rewind:', bytes)
    if (bytes > this.offset) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`)
    }
    this.offset -= bytes
    debug('rewind: offset', this.offset)
  }

  /**
   * Go to a specified offset in the stream.
   * @param {number} position The offset to go to.
   */
  seek(position) {
    debug(`seek: from ${this.offset} to ${position}`)
    if (position > this.offset) {
      this.advance(position - this.offset)
    }
    if (position < this.offset) {
      this.rewind(this.offset - position)
    }
    debug(`seek: offset is ${this.offset}`)
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
    const output = this.data[this.offset]
    this.offset += 1
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
    return this.data[offset]
  }

  /**
   * Read from the current offset and return the value.
   * @param {number} bytes The number of bytes to read.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  read(bytes, littleEndian = false) {
    // debug('read:', bytes, this.offset, littleEndian);
    const uint8 = new Uint8Array(bytes)
    if (littleEndian) {
      for (let i = bytes - 1; i >= 0; i--) {
        uint8[i] = this.readUInt8()
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.readUInt8()
      }
    }
    // debug('read =', uint8.toString('hex'));
    return uint8
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
    const uint8 = new Uint8Array(bytes)
    if (littleEndian) {
      for (let i = 0; i < bytes; i++) {
        uint8[bytes - i - 1] = this.peekUInt8(offset + i)
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.peekUInt8(offset + i)
      }
    }
    return uint8
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
    const uint8 = this.read(1)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt8(0)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The Int8 value at the current offset.
   */
  peekInt8(offset = 0) {
    const uint8 = this.peek(1, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt8(0)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt16 value at the current offset.
   */
  readUInt16(littleEndian) {
    const uint8 = this.read(2)
    const view = new DataView(uint8.buffer, 0)
    return view.getUint16(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int8 value at the current offset.
   */
  peekUInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getUint16(0, littleEndian)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  readInt16(littleEndian = false) {
    const uint8 = this.read(2)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt16(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  peekInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt16(0, littleEndian)
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
    const uint8 = this.read(4)
    const view = new DataView(uint8.buffer, 0)
    return view.getUint32(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt32 value at the current offset.
   */
  peekUInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getUint32(0, littleEndian)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  readInt32(littleEndian = false) {
    const uint8 = this.read(4)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt32(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  peekInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getInt32(0, littleEndian)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  readFloat32(littleEndian = false) {
    const uint8 = this.read(4)
    const view = new DataView(uint8.buffer, 0)
    return view.getFloat32(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  peekFloat32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getFloat32(0, littleEndian)
  }

  /**
   * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the current offset.
   */
  readFloat48(littleEndian = false) {
    const uint8 = this.read(6, littleEndian || this.nativeEndian)
    return float48(uint8)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the specified offset.
   */
  peekFloat48(offset, littleEndian = false) {
    const uint8 = this.peek(6, offset, littleEndian || this.nativeEndian)
    return float48(uint8)
  }

  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  readFloat64(littleEndian = false) {
    const uint8 = this.read(8)
    const view = new DataView(uint8.buffer, 0)
    return view.getFloat64(0, littleEndian)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  peekFloat64(offset = 0, littleEndian = false) {
    const uint8 = this.peek(8, offset)
    const view = new DataView(uint8.buffer, 0)
    return view.getFloat64(0, littleEndian)
  }

  /**
   * Read from the current offset and return the IEEE 80 bit extended float value.
   * @param {boolean} [littleEndian=this.nativeEndian] Read in Little Endian format, defaults to system value.
   * @returns {number} The Float80 value at the current offset.
   */
  readFloat80(littleEndian = this.nativeEndian) {
    const uint8 = this.read(10, littleEndian)
    return float80(uint8)
  }

  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=this.nativeEndian] Read in Little Endian format, defaults to system value.
   * @returns {number} The Float80 value at the current offset.
   */
  peekFloat80(offset = 0, littleEndian = this.nativeEndian) {
    const uint8 = this.peek(10, offset, littleEndian)
    return float80(uint8)
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
   * Read from the current offset for a given length and return the value as a string.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  readString(length, encoding = 'ascii') {
    debug('readString:', { length, encoding })
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
    debug('peekString:', { offset, length, encoding })
    return this.decodeString(offset, length, encoding, false)
  }

  /**
   * Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
   * Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom
   * @private
   * @param {number} offset The offset to read from.
   * @param {number|null} length The number of bytes to read, if not defined it is the remaining bytes in the buffer. If NULL a null terminated string will be read.
   * @param {string} encoding The encoding of the string.
   * @param {boolean} advance Flag to optionally advance the offsets.
   * @returns {string} The read value as a string.
   */
  decodeString(offset, length, encoding, advance) {
    debug('decodeString:', { offset, length, encoding, advance })
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
          const character = this.peekUInt8(offset++)
          if (character === nullEnd) {
            break
          }
          result += String.fromCharCode(character)
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

            // Split into a Surrogate Pair
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
        throw new Error(`Unknown Encoding: ${encoding}`)
      }
    }

    if (advance) {
      this.advance(length)
    }
    return result
  }

  /**
   * Resets the instance offsets to 0.
   */
  reset() {
    debug('reset')
    this.offset = 0
  }

  /**
   * Writes a single 8 bit byte.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   */
  writeUInt8(data, offset = this.offset, advance = true) {
    debug('writeUInt8:', { data, offset, advance })
    this.buffer[offset] = data
    if (advance) {
      this.offset++
    }
  }

  /**
   * Writes an unsigned 16 bit value, 2 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt16(data, offset = this.offset, advance = true, littleEndian = false) {
    debug('writeUInt16:', { data, offset, advance, littleEndian })
    if (littleEndian) {
      this.buffer[offset] = data & 0xff
      this.buffer[offset + 1] = (data & 0xff00) >> 8
    } else {
      this.buffer[offset] = (data & 0xff00) >> 8
      this.buffer[offset + 1] = data & 0xff
    }
    if (advance) {
      this.offset += 2
    }
  }

  /**
   * Writes an unsigned 24 bit value, 3 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt24(data, offset = this.offset, advance = true, littleEndian = false) {
    debug('writeUInt24:', { data, offset, advance, littleEndian })
    if (littleEndian) {
      this.buffer[offset] = data & 0x0000ff
      this.buffer[offset + 1] = (data & 0x00ff00) >> 8
      this.buffer[offset + 2] = (data & 0xff0000) >> 16
    } else {
      this.buffer[offset] = (data & 0xff0000) >> 16
      this.buffer[offset + 1] = (data & 0x00ff00) >> 8
      this.buffer[offset + 2] = data & 0x0000ff
    }
    if (advance) {
      this.offset += 3
    }
  }

  /**
   * Writes an unsigned 32 bit value, 4 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt32(data, offset = this.offset, advance = true, littleEndian = false) {
    debug('writeUInt32:', { data, offset, advance, littleEndian })
    if (littleEndian) {
      this.buffer[offset] = data & 0x000000ff
      this.buffer[offset + 1] = (data & 0x0000ff00) >> 8
      this.buffer[offset + 2] = (data & 0x00ff0000) >> 16
      this.buffer[offset + 3] = (data & 0xff000000) >> 24
    } else {
      this.buffer[offset] = (data & 0xff000000) >> 24
      this.buffer[offset + 1] = (data & 0x00ff0000) >> 16
      this.buffer[offset + 2] = (data & 0x0000ff00) >> 8
      this.buffer[offset + 3] = data & 0x000000ff
    }
    if (advance) {
      this.offset += 4
    }
  }

  /**
   * Write a series of bytes.
   * @param {number[]|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   */
  writeBytes(data, offset = this.offset, advance = true) {
    debug('writeBytes:', { data, offset, advance })
    for (let i = 0; i < data.length; i++) {
      this.buffer[offset + i] = data[i]
    }
    if (advance) {
      this.offset += data.length
    }
  }

  /**
   * Write a string as a given encoding.
   *
   * Valid encodings are: 'ascii' aka 'latin1', 'utf8' / 'utf8', 'utf16be', 'utf16le'.
   *
   * For UTF-8:
   * Up to 4 bytes per character can be used. The fewest number of bytes possible is used.
   * Characters up to U+007F are encoded with a single byte.
   * For multibyte sequences, the number of leading 1 bits in the first byte gives the number of bytes for the character. The rest of the bits of the first byte can be used to encode bits of the character.
   * The continuation bytes begin with 10, and the other 6 bits encode bits of the character.
   *
   * UTF-8 conversion interpreted from https://stackoverflow.com/posts/18729931/revisions
   * @param {string} string The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   */
  writeString(string, offset = this.offset, encoding = 'ascii', advance = true) {
    debug('writeString:', { string, offset, encoding, advance })
    const data = []
    switch (encoding) {
      case 'ascii':
      case 'latin1': {
        for (let i = 0; i < string.length; i++) {
          data.push(string.charCodeAt(i) & 0xff)
        }
        break
      }
      case 'utf8':
      case 'utf-8': {
        for (let i = 0; i < string.length; i++) {
          let charcode = string.charCodeAt(i)
          if (charcode < 0x80) {
            data.push(charcode)
          } else if (charcode < 0x800) {
            data.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
          } else if (charcode < 0xd800 || charcode >= 0xe000) {
            data.push(
              0xe0 | (charcode >> 12),
              0x80 | ((charcode >> 6) & 0x3f),
              0x80 | (charcode & 0x3f),
            )
          } else {
            i++
            // Surrogate Pair
            // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and splitting the 20 bits of 0x0-0xFFFFF into two halves.
            charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (string.charCodeAt(i) & 0x3ff))
            data.push(
              0xf0 | (charcode >> 18),
              0x80 | ((charcode >> 12) & 0x3f),
              0x80 | ((charcode >> 6) & 0x3f),
              0x80 | (charcode & 0x3f),
            )
          }
        }
        break
      }
      case 'utf16be':
      case 'utf16le':
      case 'utf16bom': {
        const littleEndian = encoding === 'utf16le'
        for (let i = 0; i < string.length; i++) {
          const charcode = string.charCodeAt(i)
          if (littleEndian) {
            data.push(charcode & 0xff, (charcode / 256) >>> 0)
          } else {
            data.push((charcode / 256) >>> 0, charcode & 0xff)
          }
        }
        break
      }
      default: {
        throw new Error(`Unknown Encoding: ${encoding}`)
      }
    }
    debug('writeString: data', data)
    this.writeBytes(data, offset, advance)
  }

  /**
   * Convert a write mode file into a read mode file.
   */
  commit() {
    debug('commit: converting to read mode file')
    this.data = new Uint8Array(this.buffer)
    this.writing = false
  }
}

export default DataBuffer
