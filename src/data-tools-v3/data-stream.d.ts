export default DataStream
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
declare class DataStream {
  /**
   * Creates a new DataStream from file data.
   * @param {string | Buffer} data The data of the image to process.
   * @returns {DataStream} The new DataStream instance for the provided file data.
   * @static
   */
  static fromData(data: string | Buffer): DataStream
  /**
   * Creates a new DataStream from a DataBuffer.
   * @param {DataBuffer} buffer The DataBuffer of the image to process.
   * @returns {DataStream} The new DataStream instance for the provided DataBuffer.
   * @static
   */
  static fromBuffer(buffer: DataBuffer): DataStream
  /**
   * Creates a new DataStream.
   * @param {DataBufferList} list The DataBufferList to process
   * @param {object} options Options for this instance
   * @param {number} [options.size=16] ArrayBuffer byteLength for the underlying binary parsing
   */
  constructor(
    list: DataBufferList,
    options?: {
      size?: number
    },
  )
  /** @type {number} ArrayBuffer byteLength */
  size: number
  /** @type {ArrayBuffer} Instance of ArrayBuffer used for the various typed arrays */
  buf: ArrayBuffer
  /** @type {Uint8Array} octet / uint8_t */
  uint8: Uint8Array
  /** @type {Int8Array} byte / int8_t */
  int8: Int8Array
  /** @type {Uint16Array} unsigned short / uint16_t */
  uint16: Uint16Array
  /** @type {Int16Array} short / int16_t */
  int16: Int16Array
  /** @type {Uint32Array} unsigned long / uint32_t */
  uint32: Uint32Array
  /** @type {Int32Array} long / int32_t */
  int32: Int32Array
  /** @type {Float32Array} unrestricted float / float */
  float32: Float32Array
  /** @type {Float64Array} unrestricted double / double */
  float64: Float64Array
  /** @type {BigInt64Array} bigint / int64_t (signed long long) */
  int64: BigInt64Array
  /** @type {BigUint64Array} bigint / uint64_t (unsigned long long) */
  uint64: BigUint64Array
  /** @type {boolean} Native Endianness of the machine, true is Little Endian, false is Big Endian */
  nativeEndian: boolean
  /** @type {DataBufferList} The DataBufferList to process */
  list: DataBufferList
  /** @type {number} Reading offset for the current chunk */
  localOffset: number
  /** @type {number} Reading offset for all chunks */
  offset: number
  /**
   * Compares input data against the current data.
   * @param {DataStream} input The DataStream to compare against.
   * @param {number} [offset=0] The offset to begin comparing at.
   * @returns {boolean} True if the data is the same as the input, starting at the offset, false is there is any difference.
   */
  compare(input: DataStream, offset?: number): boolean
  /**
   * Compares input data against the upcoming data, byte by byte.
   * @param {number[] | Buffer} input The data to check for in upcoming bytes.
   * @returns {boolean} True if the data is the upcoming data, false if it is not or there is not enough buffer remaining.
   */
  next(input: number[] | Buffer): boolean
  /**
   * Create a copy of the current DataStream and offset.
   * @returns {DataStream} A new copy of the DataStream.
   */
  copy(): DataStream
  /**
   * Checks if a given number of bytes are avaliable in the stream.
   * @param {number} bytes The number of bytes to check for.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  available(bytes: number): boolean
  /**
   * Checks if a given number of bytes are avaliable after a given offset in the stream.
   * @param {number} bytes The number of bytes to check for.
   * @param {number} offset The offset to start from.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  availableAt(bytes: number, offset: number): boolean
  /**
   * Returns the remaining bytes in the stream.
   * @returns {number} The remaining bytes in the stream.
   */
  remainingBytes(): number
  /**
   * Advance the stream by a given number of bytes.
   * @param {number} bytes The number of bytes to advance.
   * @returns {DataStream} The current DataStream.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  advance(bytes: number): DataStream
  /**
   * Rewind the stream by a given number of bytes.
   * @param {number} bytes The number of bytes to go back.
   * @returns {DataStream} The current DataStream.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  rewind(bytes: number): DataStream
  /**
   * Go to a specified offset in the stream.
   * @param {number} position The offset to go to.
   * @returns {DataStream} The current DataStream.
   */
  seek(position: number): DataStream
  /**
   * Read from the current offset and return the value.
   * @returns {number} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  readUInt8(): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  peekUInt8(offset?: number): number
  /**
   * Read from the current offset and return the value.
   * @param {number} bytes The number of bytes to read.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  read(bytes: number, littleEndian?: boolean): Uint8Array
  /**
   * Read from the provided offset and return the value.
   * @param {number} bytes The number of bytes to read.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  peek(bytes: number, offset?: number, littleEndian?: boolean): Uint8Array
  /**
   * Read the bits from the bytes from the provided offset and return the value.
   * @param {number} position The bit position to read, 0 to 7.
   * @param {number} [length=1] The number of bits to read, 1 to 8.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The value at the provided bit position of a provided length at the provided offset.
   * @throws {Error} peekBit position is invalid: ${position}, must be an Integer between 0 and 7
   * @throws {Error} `peekBit length is invalid: ${length}, must be an Integer between 1 and 8
   */
  peekBit(position: number, length?: number, offset?: number): number
  /**
   * Read from the current offset and return the value.
   * @returns {number} The Int8 value at the current offset.
   */
  readInt8(): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The Int8 value at the current offset.
   */
  peekInt8(offset?: number): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt16 value at the current offset.
   */
  readUInt16(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int8 value at the current offset.
   */
  peekUInt16(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  readInt16(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int16 value at the current offset.
   */
  peekInt16(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt24 value at the current offset.
   */
  readUInt24(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt24 value at the current offset.
   */
  peekUInt24(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int24 value at the current offset.
   */
  readInt24(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int24 value at the current offset.
   */
  peekInt24(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt32 value at the current offset.
   */
  readUInt32(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The UInt32 value at the current offset.
   */
  peekUInt32(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  readInt32(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Int32 value at the current offset.
   */
  peekInt32(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  readFloat32(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float32 value at the current offset.
   */
  peekFloat32(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the current offset.
   */
  readFloat48(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the specified offset.
   */
  peekFloat48(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  readFloat64(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float64 value at the current offset.
   */
  peekFloat64(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the IEEE 80 bit extended float value.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float80 value at the current offset.
   */
  readFloat80(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float80 value at the current offset.
   */
  peekFloat80(offset?: number, littleEndian?: boolean): number
  /**
   * Read from the current offset and return the value as a DataBuffer.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  readBuffer(length: number): DataBuffer
  /**
   * Read from the specified offset and return the value as a DataBuffer.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  peekBuffer(offset: number, length: number): DataBuffer
  /**
   * Read from the current offset of the current buffer for a given length and return the value as a DataBuffer.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  readSingleBuffer(length: number): DataBuffer
  /**
   * Read from the specified offset of the current buffer for a given length and return the value as a DataBuffer.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
   */
  peekSingleBuffer(offset: number, length: number): DataBuffer
  /**
   * Read from the current offset for a given length and return the value as a string.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  readString(length: number, encoding?: string): string
  /**
   * Read from the specified offset for a given length and return the value as a string.
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  peekString(offset: number, length: number, encoding?: string): string
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
  private decodeString
  /**
   * Resets the instance offsets to 0.
   * @memberof DataStream
   */
  reset(): void
}
import DataBufferList from './data-buffer-list.js'
import DataBuffer from './data-buffer.js'
//# sourceMappingURL=data-stream.d.ts.map
