# FOR DEV
FROM node:22-slim AS dev

WORKDIR /app

RUN apt-get update && \
apt-get install -y bash git curl procps lsof  iproute2 iputils-ping net-tools && \
rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["bash", "-c", "echo 'Container ready. Run npm run dev manually.' && tail -f /dev/null"]

# FOR PROD
FROM node:22-slim AS prod

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl iproute2 && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force

COPY . .

RUN mkdir -p backend/ssl

RUN echo '#!/bin/bash\n\
DETECTED_IP=$(ip route get 8.8.8.8 | awk "{print \\$7; exit}" 2>/dev/null || echo "127.0.0.1")\n\
if [[ -z "$DETECTED_IP" ]]; then\n\
    DETECTED_IP="127.0.0.1"\n\
fi\n\
\n\
cat > backend/ssl/openssl.conf <<EOF\n\
[req]\n\
distinguished_name = req_distinguished_name\n\
x509_extensions = v3_req\n\
prompt = no\n\
\n\
[req_distinguished_name]\n\
C=FR\n\
ST=Ile-de-France\n\
L=Paris\n\
O=Production\n\
OU=TransApp\n\
CN=localhost\n\
\n\
[v3_req]\n\
keyUsage = critical, digitalSignature, keyEncipherment\n\
extendedKeyUsage = serverAuth\n\
subjectAltName = @alt_names\n\
\n\
[alt_names]\n\
DNS.1 = localhost\n\
IP.1 = 127.0.0.1\n\
IP.2 = ${DETECTED_IP}\n\
EOF\n\
\n\
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\\n\
    -keyout backend/ssl/key.pem \\\n\
    -out backend/ssl/cert.pem \\\n\
    -config backend/ssl/openssl.conf\n\
\n\
chmod 600 backend/ssl/*.pem\n\
echo "Certificats SSL générés avec IP: $DETECTED_IP"\n\
' > /tmp/generate-ssl.sh && chmod +x /tmp/generate-ssl.sh && /tmp/generate-ssl.sh

RUN npm run build

RUN rm -rf backend/src/ && \
    rm -rf *.config.js && \
    rm -rf backend/tsconfig.json && \
    rm -rf node_modules && \
    npm ci --only=production && \
    npm install concurrently

COPY .devcontainer/entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
