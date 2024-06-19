/**
 * Convert the provided Uint8Array into a Turbo Pascal 48 bit float value.
 * May be faulty with large numbers due to float percision.
 *
 * While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
 * Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.
 *
 * The Real48 type exists for backward compatibility with Turbo Pascal. It defines a 6-byte floating-point type.
 * The Real48 type has an 8-bit exponent and a 39-bit normalized mantissa. It cannot store denormalized values, infinity, or not-a-number. If the exponent is zero, the number is zero.
 *
 * Structure (Bytes, Big Endian)
 * 5: SMMMMMMM 4: MMMMMMMM 3: MMMMMMMM 2: MMMMMMMM 1: MMMMMMMM 0: EEEEEEEE
 *
 * Structure (Bytes, Little Endian)
 * 0: EEEEEEEE 1: MMMMMMMM 2: MMMMMMMM 3: MMMMMMMM 4: MMMMMMMM 5: SMMMMMMM
 *
 * E[8]: Exponent
 * M[39]: Mantissa
 * S[1]: Sign
 *
 * Value: (-1)^s * 2^(e - 129) * (1.f)
 * @param {Uint8Array} uint8 The data to process to a float48 value.
 * @returns {number} The read value as a number.
 * @see {@link http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real|Turbo Pascal Real}
 */
export const float48 = (uint8) => {
  let mantissa = 0

  // Bias is 129, which is 0x81
  let exponent = uint8[0]
  if (exponent === 0) {
    return 0
  }
  exponent = uint8[0] - 0x81

  for (let i = 1; i <= 4; i++) {
    mantissa += uint8[i]
    mantissa /= 256
  }
  mantissa += uint8[5] & 0x7f
  mantissa /= 128
  mantissa += 1

  // Sign bit check
  if (uint8[5] & 0x80) {
    mantissa = -mantissa
  }

  const output = mantissa * 2 ** exponent
  return Number.parseFloat(output.toFixed(4))
}

/**
 * Convert the current buffer into an IEEE 80 bit extended float value.
 * @param {Uint8Array} uint8 The raw data to convert to a float80.
 * @returns {number} The read value as a number.
 * @see {@link https://en.wikipedia.org/wiki/Extended_precision|Extended_Precision}
 */
export const float80 = (uint8) => {
  const uint32 = new Uint32Array(uint8.buffer, uint8.byteOffset, uint8.byteLength / 4)
  const [high, low] = [...uint32]
  const a0 = uint8[9]
  const a1 = uint8[8]

  // 1 bit sign, -1 or +1
  const sign = 1 - (a0 >>> 7) * 2
  // 15 bit exponent
  // let exponent = (((a0 << 1) & 0xFF) << 7) | a1;
  let exponent = ((a0 & 0x7f) << 8) | a1

  if (exponent === 0 && low === 0 && high === 0) {
    return 0
  }

  // 0x7FFF is a reserved value
  if (exponent === 0x7fff) {
    if (low === 0 && high === 0) {
      return sign * Number.POSITIVE_INFINITY
    }

    return Number.NaN
  }

  // Bias is 16383, which is 0x3FFF
  exponent -= 0x3fff
  let out = low * 2 ** (exponent - 31)
  out += high * 2 ** (exponent - 63)

  return sign * out
}

export default {
  float48,
  float80,
}
