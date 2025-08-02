FROM node:22-slim

WORKDIR /app

RUN apt-get update && \
apt-get install -y bash git curl openssl procps lsof  iproute2 iputils-ping net-tools && \
rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["bash", "-c", "echo 'Container ready.' && tail -f /dev/null"]
