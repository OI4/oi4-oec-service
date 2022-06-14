import {ESyslogEventFilter} from "@oi4/oi4-oec-service-model";

import {Logger} from "@oi4/oi4-oec-service-logger";

describe('Class: Device Manager', () => {
  const logger = new Logger(true, 'TestIt', process.env.OI4_EDGE_EVENT_LEVEL as ESyslogEventFilter);
  describe('Method: log', () => {
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