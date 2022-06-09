
if [ -d ./packages/oi4-oec-service-demo/node_modules ]; then
  rm -r ./packages/oi4-oec-service-demo/node_modules
fi

mkdir -p ./packages/oi4-oec-service-demo/node_modules/@oi4 && cp -L -R ./node_modules/@oi4/ ./packages/oi4-oec-service-demo/node_modules/@oi4

docker build -t oi4-oec-service-demo -f ./packages/oi4-oec-service-demo/Dockerfile .

rm -r ./packages/oi4-oec-service-demo/node_modules
