const coder = {
  stringToUTF8Buffer: function() {
    // https://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf
    // The String type is generally used to represent textual data in a running
    // ECMAScript program, in which case each element in the String is treated as a UTF-16 code unit value.

    // https://tools.ietf.org/html/rfc3629#section-3
    //   When encoding in UTF-8 from UTF-16 data, it is necessary
    //  to first decode the UTF-16 data to obtain character numbers, which
    //  are then encoded in UTF-8 as described above.
    const uft16Buffer = this.bufferFromString(string);
    const codePoints = this.codePointsFromUTF16Buffer(uft16Buffer);
    return coder.codePointsToUTF8Buffer(codePoints);
  },

  bufferFromString: function(string) {
    const buffer = new ArrayBuffer(string.length * 2);
    const utf16View = new Uint16Array(buffer);
    for (let i = 0; i < string.length; i++) {
      utf16View[i] = string.charCodeAt(i);
    }
    return buffer;
  },

  codePointsFromUTF16Buffer: function(buffer) {
    // The implementation is based on: https://tools.ietf.org/html/rfc2781

    const uint16View = new Uint16Array(buffer);
    const codePoints = [];

    for (let i = 0; i < uint16View.length; i++) {
      const w1 = uint16View[i];
      const w2 = uint16View[i + 1];

      // 1) If W1 < 0xD800 or W1 > 0xDFFF, the character value U is the value
      //   of W1. Terminate.
      if (w1 < 0xd800 || w1 > 0xdfff) {
        codePoints.push(uint16View[i]);
      }
      // 2) Determine if W1 is between 0xD800 and 0xDBFF. If not, the sequence
      // is in error and no valid character can be obtained using W1.
      // Terminate.
      else if (!(0xd800 < w1 && w1 < 0xdfff)) {
        throw new Error("no valid character can be obtained using W1");
      }
      // 3) If there is no W2 (that is, the sequence ends with W1), or if W2
      // is not between 0xDC00 and 0xDFFF, the sequence is in error.
      // Terminate.
      else if (w2 === undefined || !(0xdc00 < w2 && w2 < 0xdfff)) {
        throw new Error("there is no W2");
      }
      // 4) Construct a 20-bit unsigned integer U', taking the 10 low-order
      //   bits of W1 as its 10 high-order bits and the 10 low-order bits of
      //   W2 as its 10 low-order bits.
      // 5) Add 0x10000 to U' to obtain the character value U. Terminate.
      else {
        codePoints.push(((0x3ff & w1) << 10) | ((0x3ff & w2) + 0x10000));
        // skip to next char, after w2
        i++;
      }
    }
    return codePoints;
  },

  codePointsToUTF8Buffer: function(codePoints) {
    let n = 0;
    const utf8Buffer = new Uint8Array(codePoints.length * 4);

    for (let i = 0; i <= codePoints.length; i++) {
      //  The implementation is based on: https://tools.ietf.org/html/rfc3629#section-3

      //  Char. number range  |        UTF-8 octet sequence
      //     (hexadecimal)    |              (binary)
      //  --------------------+---------------------------------------------
      //  0000 0000-0000 007F | 0xxxxxxx
      //  0000 0080-0000 07FF | 110xxxxx 10xxxxxx
      //  0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
      //  0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx

      const c = codePoints[i];

      if (0x0 <= c && c <= 0x7f) {
        utf8Buffer[n++] = c;
      } else if (0x80 <= c && c <= 0x7ff) {
        utf8Buffer[n++] = 0xc0 | (c >> 6);
        utf8Buffer[n++] = 0x80 | (0x3f & c >> 0);
      } else if (0x800 <= c && c <= 0xffff) {
        utf8Buffer[n++] = 0xe0 | (c >> 12);
        utf8Buffer[n++] = 0x80 | (0x3f & c >> 6);
        utf8Buffer[n++] = 0x80 | (0x3f & c >> 0);
      } else if (0x10000 <= c && c <= 0x10ffff) {
        utf8Buffer[n++] = 0xf0 | (c >> 18);
        utf8Buffer[n++] = 0x80 | (0x3f & (c >> 12));
        utf8Buffer[n++] = 0x80 | (0x3f & (c >> 6));
        utf8Buffer[n++] = 0x80 | (0x3f & (c >> 0));
      }
    }
    return utf8Buffer.slice(0, n);
  }
};

const string = "😀🏳️‍🌈aaabbcØ";
console.log(Buffer.from(coder.stringToUTF8Buffer(string)));
console.log(Buffer.from(string));
