FROM node:20

RUN mkdir /code
WORKDIR /code

ENV PATH=$PATH:/home/node/.config/yarn/global/node_modules/.bin

COPY . .

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y vim && \
    apt-get install -y awscli && \
    apt-get install -y less

RUN curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_arm64/session-manager-plugin.deb" -o "session-manager-plugin.deb" \
    && dpkg -i session-manager-plugin.deb \
    && rm -f session-manager-plugin.deb

RUN yarn global add aws-cdk@latest
RUN yarn install --frozen-lockfile