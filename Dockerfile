FROM node:16

WORKDIR /

ADD package.json / 

RUN npm i --silent

ADD . / 

CMD npm run start