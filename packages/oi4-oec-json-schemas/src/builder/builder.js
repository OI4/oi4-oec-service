/* eslint-disable */
const rootDir = '.'
const fs = require('fs')
let tempJson
let tempPath
// Get lookup for serviceTypes, resources and methods
tempPath = `${rootDir}/src/schemas/constants/serviceType.schema.json`
tempJson = readJSON(tempPath)
const serviceTypeArr = tempJson.enum
console.log('ServiceType Array:')
console.log(serviceTypeArr)

let serviceTypeRegEx = createRegExFromArr(serviceTypeArr)
console.log('ServiceType RegEx:')
console.log(serviceTypeRegEx)

tempPath = `${rootDir}/src/schemas/constants/resources.schema.json`
tempJson = readJSON(tempPath)
const resourceArr = tempJson.enum
console.log('Resource Array:')
console.log(resourceArr)

let resourceRegEx = createRegExFromArr(resourceArr)
console.log('Resource RegEx:');
console.log(resourceRegEx)

tempPath = `${rootDir}/src/schemas/constants/method.schema.json`
tempJson = readJSON(tempPath)
const methodArr = tempJson.enum
console.log('Method Array:')
console.log(methodArr)

let methodRegEx = createRegExFromArr(methodArr)
console.log('Method RegEx:');
console.log(methodRegEx);

tempPath = `${rootDir}/src/schemas/Oi4Identifier.schema.json`
tempJson = readJSON(tempPath)

console.log('Oi4Identifier.ts Orig Pattern: ');
console.log(tempJson.pattern);
const oi4IdRegEx = tempJson.pattern
  .slice(1)
  .slice(0, -1)
  .replace('/', '\\/')
  .replace('^/', '^\\/')
console.log('Oi4Identifier.ts RegEx: ');
console.log(oi4IdRegEx);

// Build RegEx for NetworkMessage
const publisherIdRegEx = `^${serviceTypeRegEx}\\/${oi4IdRegEx}$`
console.log(`PublisherId RegEx:\n${publisherIdRegEx}`)

// Build RegEx for TopicPath
const topicPathRegEx = `^Oi4\\/${serviceTypeRegEx.replace(
  ')',
  '|\\+|#)'
)}\\/${oi4IdRegEx.replace(
  '([a-z0-9-]+\\.)*([a-z0-9-]*)',
  '((([a-z0-9-]+\\.)*([a-z0-9-]*))|\\+|#)'
)}\\/${methodRegEx.replace(')', '|\\+|#)')}\\/${resourceRegEx.replace(
  ')',
  '|\\+|#)'
)}(.*)$`
console.log(`TopicPathRegEx:\n${topicPathRegEx}`)

// Read Modify Write NetworkSchemaJson
tempPath = `${rootDir}/src/schemas/NetworkMessage.schema.json`
tempJson = readJSON(tempPath)
tempJson.properties.PublisherId.pattern = publisherIdRegEx
tempJson.properties.MessageId.pattern = `^.{1,}-${publisherIdRegEx.slice(1)}`
writeJSON(tempPath, tempJson)

// Read Modify Write topicPathSchemaJson
tempPath = `${rootDir}/src/schemas/constants/topicPath.schema.json`
tempJson = readJSON(tempPath)
tempJson.pattern = topicPathRegEx
writeJSON(tempPath, tempJson)

function createRegExFromArr(arr) {
  let regex = '('
  for (const entry of arr) {
    regex = `${regex}${entry}|`
  }
  regex = regex.slice(0, -1)
  regex = `${regex})`
  return regex
}

function readJSON(path) {
  const json = JSON.parse(fs.readFileSync(path))
  return json
}

function writeJSON(path, objLiteral) {
  fs.writeFileSync(path, `${JSON.stringify(objLiteral, null, 2)}`)
}
