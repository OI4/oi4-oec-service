FROM node:16-alpine3.15

# -------INSTALL OPENSSL
RUN apk add --update openssl && rm -rf /var/cache/apk/*

# -------FIX NPM ERRORS ON LOW MEM MACHINE
RUN npm config set unsafe-perm true

RUN mkdir -p /etc/oi4/certs
RUN mkdir /etc/oi4/mqtt
RUN mkdir /etc/oi4/config
RUN mkdir -p /run/secrets/


ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/oi4-oec-service-demo

COPY packages/oi4-oec-service-demo/package.json ./

RUN npm install --production

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer@latest


RUN mkdir -p logs

COPY ./packages/oi4-oec-service-demo/node_modules/@oi4 ./node_modules/@oi4

EXPOSE 5800 5800

