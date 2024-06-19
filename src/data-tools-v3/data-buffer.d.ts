export default DataBuffer
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
declare class DataBuffer {
  /**
   * Creates an instance of DataBuffer with given size.
   * @param {number} size The size of the requested DataBuffer.
   * @returns {DataBuffer} The new DataBuffer.
   */
  static allocate(size: number): DataBuffer
  /**
   * Creates an instance of DataBuffer.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} [input] The data to process.
   * @throws {TypeError} Missing input data.
   * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
   */
  constructor(
    input?:
      | number[]
      | ArrayBuffer
      | Buffer
      | DataBuffer
      | Int8Array
      | Int16Array
      | Int32Array
      | number
      | string
      | Uint8Array
      | Uint16Array
      | Uint32Array
      | undefined,
  )
  /** @type {boolean} Is this instance for creating a new file? */
  writing: boolean
  /** @type {number[]|Buffer|Uint8Array} The bytes avaliable to read. */
  data: number[] | Buffer | Uint8Array
  /** @type {number} The number of bytes avaliable to read. */
  /** @type {DataBuffer|null} The next DataBuffer in the list. */
  next: DataBuffer | null
  /** @type {DataBuffer|null} The previous DataBuffer in the list. */
  prev: DataBuffer | null
  /** @type {boolean} Native Endianness of the machine, true is Little Endian, false is Big Endian */
  nativeEndian: boolean
  /** @type {number} Reading / Writing offset */
  offset: number
  /** @type {number[]} Buffer for creating new files. */
  buffer: number[]
  /**
   * Helper to match arrays by returning the data length.
   * @returns {number} The data length of the DataBuffer.
   */
  get length(): number
  /**
   * Compares another DataBuffer against the current data buffer at a specified offset.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} input The size of the requested DataBuffer.
   * @param {number} [offset=0] The size of the requested DataBuffer.
   * @returns {boolean} Returns true when both DataBuffers are equal, false if there is any difference.
   */
  compare(
    input:
      | number[]
      | ArrayBuffer
      | Buffer
      | DataBuffer
      | Int8Array
      | Int16Array
      | Int32Array
      | number
      | string
      | Uint8Array
      | Uint16Array
      | Uint32Array
      | undefined,
    offset?: number,
  ): boolean
  /**
   * Creates a copy of the current DataBuffer.
   * @returns {DataBuffer} A new copy of the current DataBuffer.
   */
  copy(): DataBuffer
  /**
   * Creates a copy of the current DataBuffer from a specified offset and a specified length.
   * @param {number} position The starting offset to begin the copy of the new DataBuffer.
   * @param {number} [length=this.length] The size of the new DataBuffer.
   * @returns {DataBuffer} The new DataBuffer
   */
  slice(position: number, length?: number): DataBuffer
  /**
   * Returns the remaining bytes to be read in the DataBuffer.
   * @returns {number} The remaining bytes to bre read in the DataBuffer.
   */
  remainingBytes(): number
  /**
   * Checks if a given number of bytes are avaliable in the DataBuffer.
   * If writing mode is enabled, this is always true.
   * @param {number} bytes The number of bytes to check for.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the DataBuffer.
   */
  available(bytes: number): boolean
  /**
   * Checks if a given number of bytes are avaliable after a given offset in the buffer.
   * If writing mode is enabled, this is always true.
   * @param {number} bytes The number of bytes to check for.
   * @param {number} offset The offset to start from.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
   */
  availableAt(bytes: number, offset: number): boolean
  /**
   * Advance the offset by a given number of bytes.
   * @param {number} bytes The number of bytes to advance.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  advance(bytes: number): void
  /**
   * Rewind the offset by a given number of bytes.
   * @param {number} bytes The number of bytes to go back.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  rewind(bytes: number): void
  /**
   * Go to a specified offset in the stream.
   * @param {number} position The offset to go to.
   */
  seek(position: number): void
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
   * @param {boolean} [littleEndian=this.nativeEndian] Read in Little Endian format, defaults to system value.
   * @returns {number} The Float80 value at the current offset.
   */
  readFloat80(littleEndian?: boolean): number
  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=this.nativeEndian] Read in Little Endian format, defaults to system value.
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
   * @param {number|null} length The number of bytes to read, if not defined it is the remaining bytes in the buffer. If NULL a null terminated string will be read.
   * @param {string} encoding The encoding of the string.
   * @param {boolean} advance Flag to optionally advance the offsets.
   * @returns {string} The read value as a string.
   */
  private decodeString
  /**
   * Resets the instance offsets to 0.
   */
  reset(): void
  /**
   * Writes a single 8 bit byte.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   */
  writeUInt8(data: number, offset?: number, advance?: boolean): void
  /**
   * Writes an unsigned 16 bit value, 2 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt16(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void
  /**
   * Writes an unsigned 24 bit value, 3 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt24(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void
  /**
   * Writes an unsigned 32 bit value, 4 bytes.
   * @param {number} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   * @param {boolean} [littleEndian=false] Endianness of the write order.
   */
  writeUInt32(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void
  /**
   * Write a series of bytes.
   * @param {number[]|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array} data The data to write.
   * @param {number} [offset=this.offset] The offset to write the data to.
   * @param {boolean} [advance=true] Flag to increment the offset to the next position.
   */
  writeBytes(
    data: number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array,
    offset?: number,
    advance?: boolean,
  ): void
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
  writeString(string: string, offset?: number, encoding?: string, advance?: boolean): void
  /**
   * Convert a write mode file into a read mode file.
   */
  commit(): void
}
//# sourceMappingURL=data-buffer.d.ts.map
