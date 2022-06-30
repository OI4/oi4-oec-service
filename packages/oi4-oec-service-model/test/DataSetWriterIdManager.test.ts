import {DataSetWriterIdManager} from "../src";
import {Resource} from "@oi4/oi4-oec-service-model";

describe('Unit test for DataSetWriterIdManager', () => {

    beforeEach(()=>{
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })
    afterAll(()=>{
        DataSetWriterIdManager.resetDataSetWriterIdManager();
    })

    it('Valid DataSetWriterIds are returned', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.EVENT, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.EVENT, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.EVENT, 'A2')).toBe(1);
    });

    it('Valid DataSetWriterIds are returned for publication and subscription list', () => {
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.PUBLICATION_LIST, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.PUBLICATION_LIST, 'A1')).toBe(0);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.PUBLICATION_LIST, 'A2')).toBe(0);

        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.SUBSCRIPTION_LIST, 'A1')).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.SUBSCRIPTION_LIST, 'A1')).toBe(1);
        expect(DataSetWriterIdManager.getDataSetWriterId(Resource.SUBSCRIPTION_LIST, 'A2')).toBe(1);
    });
});