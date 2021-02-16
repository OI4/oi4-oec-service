const Logger = require('./index');


describe('Class: Device Manager', () => {
  const logger = new Logger();
  describe('Method: log', () => {
    test('Setter', () => {
      expect(() => {
        logger.enabled = 'kappa';
      }).toThrow();
    });
    test('Getter', () => {
      logger.enabled = true;
      expect(logger.enabled).toEqual(true);
    });
    test('Test: Expect a log', () => {
      const testString = 'testing log';
      const ret = logger.log(testString);
      expect(ret).toEqual(testString);
    });
  });
});
