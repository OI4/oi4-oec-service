bin/ash

yarn build || {
  exit 1
}

mkdir -p ./packages/oi4-oec-service-demo/node_modules/@oi4 && cp -L -R ./node_modules/@oi4/ ./packages/oi4-oec-service-demo/node_modules/@oi4

yarn --cwd "./packages/oi4-oec-service-demo/" build

docker build -t oi4-oec-service-demo -f ./packages/oi4-oec-service-demo/Dockerfile .

