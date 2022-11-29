const reservedChars: string[] = [
  ',',
  '#',
  '/',
  ':',
  '?',
  '@',
  '[',
  ']',
  '!',
  '$',
  '&',
  '‘',
  '(',
  ')',
  '*',
  '+',
  ';',
  '=',
];
const prohibitedPrintableChars: string[] = [
  ' ',
  '"',
  '%',
  '<',
  '>',
  '\\',
  '^',
  '`',
  '{',
  '|',
  '}',
];

/**
 * Masks all characters unallowed by DIN 91406
 * @param input string to encode into dnp-encoding
 * @returns string with all reserved & prohibited printable characters masked
 */
export function encode(input: string): string {
  let output = input;

  // replace each found problematic character with its decimal representration of the us-ascii code, starting with an ,=44
  reservedChars.forEach((char) => {
    output = output.replace(
      char,
      ',' + char.charCodeAt(0).toString(16).toUpperCase(),
    );
  });
  prohibitedPrintableChars.forEach((char) => {
    output = output.replace(
      char,
      ',' + char.charCodeAt(0).toString(16).toUpperCase(),
    );
  });

  return output;
}

/**
 * Unmasks all dnp-encoded characters in a string
 * @param input
 * @returns
 */
export function decode(input: string): string {
  // match all 2 hex digits after each comma, get it as iterator and flatten the array as we only have one element per match with our regex
  const encHexDigits = [...input.matchAll(/(?<=,)[\S]{2}/g)].flat();

  let output = input;
  encHexDigits.forEach((elem) => {
    // we add the comma only for matching in the string so the encHexDigits array is clean and can directly be convertet to ASCII
    output = output.replace(
      ',' + elem,
      String.fromCharCode(parseInt(elem, 16)),
    );
  });

  return output;
}
