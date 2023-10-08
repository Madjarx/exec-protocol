# https://github.com/garethfuller/hardhat-template/blob/main/Dockerfile.dev
FROM bstreet/exec-protocol-deps:latest

ENV APP_ROOT /app
WORKDIR ${APP_ROOT}

# TODO: should we use COPY?
ADD ./ ${APP_ROOT}

RUN pwd && ls -alh && tree -I node_modules .

RUN npx hardhat --help

EXPOSE 8545

CMD [ "yarn", "dev" ]
