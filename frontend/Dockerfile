FROM node:24-slim

RUN apt-get update

RUN groupadd app && useradd -m -g app app

WORKDIR /app
RUN npm init -y
COPY package.json .
RUN npm install

RUN chown -R app:app /app
USER app

COPY . .

# RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "dev"]