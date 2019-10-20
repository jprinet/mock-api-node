FROM node:10
MAINTAINER Jerome Prinet

USER node

WORKDIR /home/node

COPY package*.json ./
RUN npm install

COPY index.js .
COPY configuration.json .

RUN mkdir -p hello/world
COPY hello/world/* hello/world/

EXPOSE 8001

CMD [ "node", "index.js" ]
