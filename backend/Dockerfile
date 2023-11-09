FROM node:20.3.1

WORKDIR /app

#include node_modules in the $path
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app
COPY package-lock.json /app

RUN npm install 

# copy source code
COPY . /app

CMD [ "npm", "start"]