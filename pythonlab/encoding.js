// Unicode 碼位與 UTF-8 位元組分開呈現，避免把中文字當作 ASCII。
export function characterInfo(character) {
  if ([...character].length !== 1) throw new Error('請輸入一個字元，例如 A、中或 😀。');
  return codePointInfo(character.codePointAt(0));
}
export function codePointInfo(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) throw new Error('請輸入有效的 Unicode 碼位（0～1114111，排除 55296～57343）。');
  const character = String.fromCodePoint(value);
  return { character, decimal: value, hex: '0x' + value.toString(16), binary: '0b' + value.toString(2), unicode: 'U+' + value.toString(16).toUpperCase().padStart(4, '0'), ascii: value <= 127, control: value < 32 || (value >= 127 && value <= 159), bytes: [...new TextEncoder().encode(character)] };
}
export function parseCodePoint(text) {
  const value = text.trim();
  if (!/^(?:\d+|0x[0-9a-f]+|0b[01]+)$/i.test(value)) throw new Error('可輸入十進位整數、0x 開頭的十六進位或 0b 開頭的二進位。');
  return codePointInfo(Number(value));
}
