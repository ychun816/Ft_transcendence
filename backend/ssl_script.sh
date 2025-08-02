#!/bin/bash

# Se placer dans le dossier du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mkdir -p ssl

openssl genrsa -out ssl/key.pem 4096

openssl req -new -x509 -nodes -key ssl/key.pem -out ssl/cert.pem -days 365 -config ssl/openssl.conf -extensions v3_req

chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ Certificats générés avec succès dans le dossier 'ssl/' !"
openssl x509 -in ssl/cert.pem -text -noout | grep -A 5 "Subject Alternative Name"
