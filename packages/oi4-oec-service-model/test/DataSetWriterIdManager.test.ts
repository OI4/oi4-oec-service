import {DataSetWriterIdManager, Resources} from '../src';

describe('Unit test for DataSetWriterIdManager', () => {

    beforeEach(()=>{
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })
    afterAll(()=>{
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })

    it('Valid DataSetWriterIds are returned', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.EVENT, 'A2')).toBe(1);
    });

    it('Valid DataSetWriterIds are returned for publication and subscription list', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.PUBLICATION_LIST, 'A2')).toBe(0);

        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, 'A1')).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, 'A1')).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resources.SUBSCRIPTION_LIST, 'A2')).toBe(1);
    });
});
