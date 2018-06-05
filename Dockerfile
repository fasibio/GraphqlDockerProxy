FROM node:6
ADD ./src/ /src
WORKDIR /src
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]