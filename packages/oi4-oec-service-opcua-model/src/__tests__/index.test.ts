import {OPCUABuilder} from '../index';
const mam = require('../__fixtures__/mam_network_message.json');

test('checks OPC UA JSON validity', () => {
    const builder = new OPCUABuilder('', '');
    return builder.checkOPCUAJSONValidity(mam).then(result => {
        expect(result).toBe(true);
    });
});
