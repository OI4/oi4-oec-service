const reservedChars = new Map([
    [ '!', ',21' ],
    [ '\'', ',39' ],
    [ '(', ',28' ],
    [ ')', ',29' ],
    [ '*', ',2A' ]

]);

/**
 * Masks all characters forbidden by DIN 91406
 * @param input string to encode into dnp-encoding
 * @returns string with all reserved & prohibited printable characters masked
 */
export function dnpEncode(input = ''): string {
    input = encodeURIComponent(input).replaceAll('%', ',');
    reservedChars.forEach((value: string, key: string) => {
        input = input.replaceAll(key, value);
    });
    return input;
}

/**
 * Unmasks all dnp-encoded characters in a string
 * @param input
 * @returns
 */
export function dnpDecode(input = ''): string {
    reservedChars.forEach((value: string, key: string) => {
        input = input.replaceAll(value, key);
    });
    return decodeURIComponent(input.replaceAll(',', '%'));
}
