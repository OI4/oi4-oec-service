# Open Industry 4.0 Community JSON schemas

> Stores a set of JSON schemas, which can be used to validate the payload format of messages against the Open Industry 4.0
> Alliance Development Guide specifications

Schemas named [PascalCase](https://techterms.com/definition/pascalcase) are OPC Foundation defined formats. In contrast,
[camelCase](https://techterms.com/definition/camelcase) named schemas are formats defined by the Open Industry 4.0 Alliance
and specified in the Development Guideline of the alliance.

Camel cased schemas define Open Industry 4.0 resources.

JSON schemas can be also verified using online validators such as https://www.jsonschemavalidator.net/. Be aware, that linked
schemas will not be found in the online validators.

## Structure

Initially used to store the final Schema files, the schemas became increasingly complex and now include RegExes which consist of information found in other Schemas.\
Since there is no known way to reference other RegExes from inside RegExes, a small builder was added to extract the necessary information and build larger RegExes.

## Example

The most convoluted example is found in the subscriptionList schema, where the property "topicPath" consists of:\
`oi4`/`<serviceType>`/`<appId>`/`<method>`/`<resource>`/`<anyTag>`

The information of each individual part can be found in the corresponding schemas.

## Build

The "binary" schemas are always stored in the schemas folder, but in order to be sure,
simply run `node builder/index.js` and the RegExes of subscriptionList->topicPath and NetWorkMessage->PublisherId will be updated.

## Limitations

The schemas cannot check for logical errors.\
For example, if a '#' character is detected in a topic path, more topic levels should be disallowed,\
but the following topic will still be considered valid:\
`oi4`/`Registry`/`urn:myManu.com/myModel/myPC/mySer`/`get`/`#`/`myTag`
