import {GenericEvent, StatusEvent} from '../../src';
import {EventCategory, IEvent, NamurNE107Event, Resources, SyslogEvent} from '@oi4/oi4-oec-service-model';

describe('Unit test for IEvents', () => {

    const description = 'Hello World!';

    const assertEvent = (event: IEvent): void => {
        expect(event.Details).toBeUndefined();
        expect(event.Description).toBe(description);
        expect(event.Number).toBe(10);
        expect(event.resourceType()).toBe(Resources.EVENT);
    }

    it('Should produce SysLogEvent', async () => {
        const event: SyslogEvent = new SyslogEvent(10, description);
        assertEvent(event);
        expect(event.Category).toBe(EventCategory.CAT_SYSLOG_0);

        event.Details = { MSG: 'msg', HEADER: 'header'};
        expect(event.Details.MSG).toBe('msg');
        expect(event.Details.HEADER).toBe('header');
    });

    it('Should produce StatusEvent', async () => {
        const event: StatusEvent = new StatusEvent(10, description);
        assertEvent(event);
        expect(event.Category).toBe(EventCategory.CAT_STATUS_1);

        event.Details = { SymbolicId: 'Good'};
        expect(event.Details.SymbolicId).toBe('Good');
    });

    it('Should produce Ne107Event', async () => {
        const event: NamurNE107Event = new NamurNE107Event(10, description);
        assertEvent(event);
        expect(event.Category).toBe(EventCategory.CAT_NE107_2);

        event.Details = { DiagnosticCode: 'dc', Location: 'loc'};
        expect(event.Details.DiagnosticCode).toBe('dc');
        expect(event.Details.Location).toBe('loc');
    });

    it('Should produce GenericEvent', async () => {
        const event: GenericEvent = new GenericEvent(10, description);
        assertEvent(event);
        expect(event.Category).toBe(EventCategory.CAT_GENERIC_99);

        event.Details = { message: 'test'};
        expect(event.Details.message).toBe('test');
    });
});
