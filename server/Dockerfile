FROM node:15.5.1-alpine
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 3000
CMD yarn start