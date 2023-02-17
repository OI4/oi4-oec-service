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
 * Masks all reserved characters in a given string
 * @param input string to replace all dnp reserved chars
 * @returns string with all reserved chars masked
 */
function replaceReservedChars(input: string): string {
    let output: string = input;

    // replace each found problematic character with its decimal representation of the us-ascii code, starting with an ,=44
    reservedChars.forEach((char) => {
        output = output.replaceAll(
            char,
            `,${char.charCodeAt(0).toString(16).toUpperCase()}`,
        );
    });

    return output;
}

/**
 * Masks all prohibited characters in a given string
 * @param input string to replace all dnp prohibited chars
 * @returns string with all reserved chars masked
 */
function replaceProhibitedChars(input: string): string {
    let output: string = input;

    // replace each found problematic character with its decimal representation of the us-ascii code, starting with an ,=44
    prohibitedPrintableChars.forEach((char) => {
        output = output.replaceAll(
            char,
            `,${char.charCodeAt(0).toString(16).toUpperCase()}`,
        );
    });

    return output;
}

/**
 * Masks all characters forbidden by DIN 91406
 * @param input string to encode into dnp-encoding
 * @returns string with all reserved & prohibited printable characters masked
 */
export function encode(input: string): string {
    let output = input;

    // replace each found problematic character (including UTF-8) with its decimal representation of the us-ascii code, starting with an ,=44
    output = encodeURI(replaceProhibitedChars(replaceReservedChars(output)));
    
    // if the url encode did encode some elements one needs to mask the %
    if (prohibitedPrintableChars.some(elem => {
        if (output.includes(elem)) {
            return true;
        } else {
            return false;
        }
    })) output = replaceProhibitedChars(output);
    
    return output;
}

/**
 * Unmasks all dnp-encoded characters in a string
 * @param input
 * @returns
 */
export function decode(input: string): string {
    // match all 2 hex digits after each comma, get it as iterator and flatten the array as we only have one element per match with our regex
    const encHexDigits = [...input.matchAll(/(?<=,)\S{2}/g)].flat();

    let output = decodeURI(input);
    encHexDigits.forEach((elem) => {
        // we add the comma only for matching in the string so the encHexDigits array is clean and can directly be converted to ASCII
        output = output.replaceAll(
            `,${elem}`,
            String.fromCharCode(parseInt(elem, 16)),
        );
    });

    return decodeURI(output);
}
