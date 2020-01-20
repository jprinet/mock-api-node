FROM node:12
MAINTAINER Jerome Prinet

USER node

WORKDIR /home/node

COPY package*.json ./
COPY index.js .
COPY rest/ rest
COPY soap/ soap

RUN npm install

CMD [ "node", "index.js" ]
