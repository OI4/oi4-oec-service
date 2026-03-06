import {DataSetWriterIdManager, Resources, Oi4Identifier} from '../src';

describe('Unit test for DataSetWriterIdManager', () => {

    const source = Oi4Identifier.fromString('A/B/C/D');
    const source2 = Oi4Identifier.fromString('E/F/G/H');

    beforeEach(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })
    afterAll(() => {
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })

    it('Valid DataSetWriterIds are returned', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, source)).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, source)).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, source2)).toBe(1);
    });

    it('Valid DataSetWriterIds are returned for publication and subscription list', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, source)).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, source)).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, source2)).toBe(0);

        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, source)).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, source )).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, source2)).toBe(1);
    });
});
