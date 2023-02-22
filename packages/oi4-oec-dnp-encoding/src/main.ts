const reservedChars = new Map([
    [ '!', ',21' ],
    [ '\'', ',39' ],
    [ '(', ',28' ],
    [ ')', ',29' ],
    [ '*', ',2A' ]

]);

/**
 * Masks all reserved characters by DIN 91406 in a given string
 * @param input string to be encoded into dnp-encoding
 * @returns string with all reserved chars masked
 */
export function dnpEncode(input = ''): string {
    input = encodeURIComponent(input).replaceAll('%', ',');
    reservedChars.forEach((value: string, key: string) => {
        input = input.replaceAll(key, value);
    });
    return input;
}

/**
 * Masks all prohibited characters by DIN 91406 in a given string
 * @param input
 * @returns
 */
export function dnpDecode(input = ''): string {
    reservedChars.forEach((value: string, key: string) => {
        input = input.replaceAll(value, key);
    });
    return decodeURIComponent(input.replaceAll(',', '%'));
}
