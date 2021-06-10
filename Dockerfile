FROM node:14.16.1-alpine AS build
WORKDIR /server
COPY package*.json yarn.lock ./
COPY tsconfig.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
RUN yarn install --production=true

FROM alpine:3
RUN apk add nodejs --no-cache
WORKDIR /showrunner/server/
COPY package*.json ./
COPY --from=build /server/node_modules /showrunner/server/node_modules
COPY --from=build /server/dist /showrunner/server/
EXPOSE 3001
CMD node app.js