FROM node:16-alpine3.15

# -------INSTALL OPENSSL
RUN apk add --update openssl && rm -rf /var/cache/apk/*

# -------FIX NPM ERRORS ON LOW MEM MACHINE
RUN npm config set unsafe-perm true

RUN mkdir -p /etc/oi4/certs
RUN mkdir /etc/oi4/mqtt
RUN mkdir /etc/oi4/config
RUN mkdir -p /run/secrets/

WORKDIR /usr/oi4-oec-service-demo

COPY packages/oi4-oec-service-demo/package.json ./

RUN npm install --production

RUN mkdir -p logs

COPY ./packages/oi4-oec-service-demo/node_modules/@oi4 ./node_modules/@oi4
COPY packages/oi4-oec-service-demo/dist/index.js ./

EXPOSE 5800 5800

