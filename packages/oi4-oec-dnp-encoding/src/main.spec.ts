import { encode, decode } from './main';

describe('encode functionality', () => {
  it('should be defined', () => {
    expect(encode).toBeDefined();
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
  ])('should encode %s to a valid dnp-encoded string', (text, result) => {
    expect(encode(text)).toEqual(result);
  });
});

describe('decode functionality', () => {
  it('should be defined', () => {
    expect(decode).toBeDefined();
  });

  test.each([
    ['MyModel', 'MyModel'],
    ['MySerial', 'MySerial'],
    ['MyProductCode', 'MyProductCode'],
    ['ABC,20DEF', 'ABC DEF'],
    ['123.456,2F3,268', '123.456/3&8'],
    ['123456,2333', '123456#33'],
    ['ABC,40home', 'ABC@home'],
    ['ABC,2A33,3C4', 'ABC*33<4'],
    ['20123.4', '20123.4'],
  ])('should decode %s to a valid string', (text, result) => {
    expect(decode(text)).toEqual(result);
  });
});
