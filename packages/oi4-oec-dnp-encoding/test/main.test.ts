// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {dnpEncode, dnpDecode} from '../src/main';

describe('encode functionality', () => {
    it('should be defined', () => {
        expect(dnpEncode).toBeDefined();
    });

    test.each([
        ['MyModel', 'MyModel'],
        ['MySerial', 'MySerial'],
        ['MyProductCode', 'MyProductCode'],
        ['ABC DEF', 'ABC,20DEF'],
        ['123.456/3&8', '123.456,2F3,268'],
        ['123456#33', '123456,2333'],
        ['ABC@home', 'ABC,40home'],
        ['ABC*33<4', 'ABC,2A33,3C4'],
        ['20123.4', '20123.4'],
        ['a/asd asd/dddd', 'a,2Fasd,20asd,2Fdddd'],
        ['¥',',25C2,25A5'],
        ['a¥,bא, ٺ,cD', 'a,25C2,25A5,2Cb,25D7,2590,2C,20,25D9,25BA,2CcD'],
        ['🂢🂣🂮🂹🃱',',25F0,259F,2582,25A2,25F0,259F,2582,25A3,25F0,259F,2582,25AE,25F0,259F,2582,25B9,25F0,259F,2583,25B1'],
        ['🫒🪕',',25F0,259F,25AB,2592,25F0,259F,25AA,2595'],
        ['aæc', 'a,C3,A6c'],
    ])('should encode %s to a valid dnp-encoded string', (text, result) => {
        expect(dnpEncode(text)).toEqual(result);
    });
});

describe('decode functionality', () => {
    it('should be defined', () => {
        expect(dnpDecode).toBeDefined();
    });

    test.each([
        ['MyModel', 'MyModel'],
        ['MySerial', 'MySerial'],
        ['MyProductCode', 'MyProductCode'],
        ['ABC,2520DEF', 'ABC DEF'],
        ['123.456,2F3,268', '123.456/3&8'],
        ['123456,2333', '123456#33'],
        ['ABC,40home', 'ABC@home'],
        ['ABC,2A33,3C4', 'ABC*33<4'],
        ['20123.4', '20123.4'],
        ['a,2Fasd,20asd,2Fdddd', 'a/asd asd/dddd'],
        [',25C2,25A5','¥'],
        ['a,25C2,25A5,2Cb,25D7,2590,2C,20,25D9,25BA,2CcD', 'a¥,bא, ٺ,cD',],
        [',25F0,259F,2582,25A2,25F0,259F,2582,25A3,25F0,259F,2582,25AE,25F0,259F,2582,25B9,25F0,259F,2583,25B1','🂢🂣🂮🂹🃱'],
        [',25F0,259F,25AB,2592,25F0,259F,25AA,2595','🫒🪕'],
        ['a,C3,A6c', 'aæc'],
    ])('should decode %s to a valid string', (text, result) => {
        expect(dnpDecode(text)).toEqual(result);
    });
});
