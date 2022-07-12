ARG 6=base

FROM node:16-alpine3.15 as build_base

ARG PACKAGES_AUTH_TOKEN=NOT_SET

# -------INSTALL OPENSSL
RUN apk add --update openssl && rm -rf /var/cache/apk/*

# -------FIX NPM ERRORS ON LOW MEM MACHINE
RUN npm config set unsafe-perm true

RUN mkdir -p /etc/oi4/certs; mkdir /etc/oi4/mqtt; mkdir /etc/oi4/mqtt; mkdir /etc/oi4/config; mkdir -p /run/secrets/

WORKDIR /usr/oi4-oec-dswb-connector

COPY ./package.json ./
COPY ./.npmrc ./

RUN npm install --omit=dev


FROM build_base as build_snapshot

ONBUILD RUN rm -rf ./node_modules/@oi4
ONBUILD COPY ./node_modules/@oi4 ./node_modules/@oi4

FROM build_${BUILD_ENV}

RUN mkdir -p logs

COPY ./node_modules/@oi4 ./node_modules/@oi4
COPY ./dist/src/app.js ./

COPY ./scripts/entrypoint.sh ./scripts/

RUN chmod +x "./scripts/entrypoint.sh"
ENTRYPOINT ["./scripts/entrypoint.sh"]
