import { matchersWithOptions } from 'jest-json-schema'
import schema from '../src/schemas/constants/topicPath.schema.json'

expect.extend(
  matchersWithOptions({
    verbose: true,
  })
)

describe('topicPath schema', () => {
  it('validate schema', () => {
    expect(schema).toBeValidSchema()
  })

  it('test valid MAM topics', () => {
    expect('Oi4/Registry/a/1/b/2/Get/MAM').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/MAM/c/3/d/4').toMatchSchema(schema)

    expect('Oi4/Registry/a/1/b/2/Pub/MAM').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/MAM/c/3/d/4').toMatchSchema(schema)
  })

  it('test valid Health topics', () => {

    expect('Oi4/Registry/a/1/b/2/Get/Health').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/Health/c/3/d/4').toMatchSchema(schema)

    expect('Oi4/Registry/a/1/b/2/Pub/Health').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/Health/c/3/d/4').toMatchSchema(schema)
  })

  it('test valid Config topics', () => {
    expect('Oi4/Registry/a/1/b/2/Get/Config').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/Config/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/Config/c/3/d/4/filter').toMatchSchema(schema)
   
    expect('Oi4/Registry/a/1/b/2/Pub/Config').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/Config/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/Config/c/3/d/4/filter').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Set/Config/c/3/d/4/filter').toMatchSchema(schema)
  })

  it('test valid License topics', () => {
    expect('Oi4/Registry/a/1/b/2/Get/License').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/License/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/License/c/3/d/4/licenseId').toMatchSchema(schema)

    expect('Oi4/Registry/a/1/b/2/Pub/License').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/License/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/License/c/3/d/4/licenseId').toMatchSchema(schema)
  })

  it('test valid LicenseText topics', () => {
    expect('Oi4/Registry/a/1/b/2/Get/LicenseText').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/LicenseText/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/LicenseText/c/3/d/4/licenseId').toMatchSchema(schema)

    expect('Oi4/Registry/a/1/b/2/Pub/LicenseText').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/LicenseText/c/3/d/4').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/LicenseText/c/3/d/4/licenseId').toMatchSchema(schema)
  });

  it('test valid RtLicense topics', () => {
    expect('Oi4/Registry/a/1/b/2/Get/RtLicense').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Get/RtLicense/c/3/d/4').toMatchSchema(schema)

    expect('Oi4/Registry/a/1/b/2/Pub/RtLicense').toMatchSchema(schema)
    expect('Oi4/Registry/a/1/b/2/Pub/RtLicense/c/3/d/4').toMatchSchema(schema)
  });

  it('test valid Data topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/Data').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/Data/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/Data/a/b/c/d/oee').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/Data').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/Data/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/Data/a/b/c/d/oee').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/Data/a/b/c/d/oee/Oi4Pv').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Set/Data/a/b/c/d/oee').toMatchSchema(schema)
  });

  it('test valid Metadata topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/Metadata/a/b/c/d/oee').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/Metadata/a/b/c/d/oee').toMatchSchema(schema)
  });


  it('test valid Event topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Pub/Event/a/b/c/d/eventCategory/eventLevel').toMatchSchema(schema)
  });

  it('test valid Profile topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/Profile').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/Profile/a/b/c/d').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/Profile').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/Profile/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid PublicationList topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/PublicationList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/PublicationList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/PublicationList/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/PublicationList').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/PublicationList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/PublicationList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/PublicationList/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/PublicationList').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Set/PublicationList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Set/PublicationList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
  });

  it('test valid SubscriptionList topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/SubscriptionList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/SubscriptionList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/SubscriptionList/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/SubscriptionList').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/SubscriptionList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/SubscriptionList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/SubscriptionList/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/SubscriptionList').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Set/SubscriptionList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Set/SubscriptionList/a/b/c/d/resourceType/tag').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Del/SubscriptionList/a/b/c/d/resourceType').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Del/SubscriptionList/a/b/c/d/resourceType/tag').toMatchSchema(schema)
  });

  it('test valid ReferenceDesignation topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Get/ReferenceDesignation/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Get/ReferenceDesignation').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Pub/ReferenceDesignation/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Pub/ReferenceDesignation').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Set/ReferenceDesignation/a/b/c/d').toMatchSchema(schema)

    expect('Oi4/OTConnector/a/1/b/2/Del/ReferenceDesignation/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid FileUpload topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Call/FileUpload/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Reply/FileUpload/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid FileDownload topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Call/FileDownload/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Reply/FileDownload/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid FirmwareUpdate topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Call/FirmwareUpdate/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Reply/FirmwareUpdate/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid Blink topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Call/Blink/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Reply/Blink/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid NewDataSetWriterId topics', () => {
    expect('Oi4/OTConnector/a/1/b/2/Call/NewDataSetWriterId/a/b/c/d').toMatchSchema(schema)
    expect('Oi4/OTConnector/a/1/b/2/Reply/NewDataSetWriterId/a/b/c/d').toMatchSchema(schema)
  });

  it('test valid DNP encoded topics', () => {
    // DNP encoded paths
    expect('Oi4/Registry/a/1,20,25/b/2/Get/MAM').toMatchSchema(schema)
  })

  // invalid characters in a topic path that shall be DNP encoded
  const invalidCharacters = ['#', '/', ':', '?', '@', '[', ']', '!', '$', '&', '\'', '(', ')', '*', '+', ',', ';', '=', ' ', '"', '%', '<', '>', '\\', '^', '`', '{', '|', '}'];

  // tests that schema detects all invalid characters
  it.each(invalidCharacters as [])(
    '(%#) topic path shall not contain character %s',
    (character) => {
        expect(`Oi4/Registry/a${character}b/1/b/2/Pub/Health`).not.toMatchSchema(schema)
    }
  )

  it('test invalid values', () => {
    // old 1.0 topics
    expect('oi4/Registry/a/1/b/2/pub/health').not.toMatchSchema(schema)
    expect('oi4/Registry/a/1/b/2/pub/health/a/b/c/d').not.toMatchSchema(schema)

    // mixed 1.0 and 1.1 topics:
    expect('Oi4/Registry/a/1/b/2/pub/health/a/b/c/d').not.toMatchSchema(schema)
    expect('oi4/Registry/a/1/b/2/Pub/health/a/b/c/d').not.toMatchSchema(schema)
    expect('oi4/Registry/a/1/b/2/pub/Health/a/b/c/d').not.toMatchSchema(schema)

    // wrong 1.1 topics
    expect('Oi4/Unknown/a/1/b/2/Call/NewDataSetWriterId/a/b/c/d').not.toMatchSchema(schema)

    // invalid objects
    expect(-129).not.toMatchSchema(schema)
    expect(-1.5).not.toMatchSchema(schema)
    expect(128).not.toMatchSchema(schema)

    expect(() => {
      expect(-129).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-129')
    expect(() => {
      expect(-1.5).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('-1.5')
    expect(() => {
      expect(128).toMatchSchema(schema)
    }).toThrowErrorMatchingSnapshot('128')
  })
})
