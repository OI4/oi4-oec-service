rm -rf ./node_modules/@oi4/oi4-oec-json-schemas
rm -rf ./node_modules/@oi4/oi4-oec-service-conformity-validator
rm -rf ./node_modules/@oi4/oi4-oec-service-logger
rm -rf ./node_modules/@oi4/oi4-oec-service-model
rm -rf ./node_modules/@oi4/oi4-oec-service-node
rm -rf ./node_modules/@oi4/oi4-oec-service-opcua-model

cp -R ../oi4-oec-json-schemas/ ./node_modules/@oi4/oi4-oec-json-schemas
cp -R ../oi4-oec-service-conformity-validator/ ./node_modules/@oi4/oi4-oec-service-conformity-validator
cp -R ../oi4-oec-service-logger/ ./node_modules/@oi4/oi4-oec-service-logger
cp -R ../oi4-oec-service-model/ ./node_modules/@oi4/oi4-oec-service-model
cp -R ../oi4-oec-service-node/ ./node_modules/@oi4/oi4-oec-service-node
cp -R ../oi4-oec-service-opcua-model/ ./node_modules/@oi4/oi4-oec-service-opcua-model
