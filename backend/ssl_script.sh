#!/bin/bash

# Configuration pour accès distant
PUBLIC_IP="10.16.11.13"
DOMAIN_NAME="localhost"

echo "🔐 Génération des certificats SSL pour accès distant"
echo "=================================================="
echo "IP publique: $PUBLIC_IP"
echo ""

# Créer le dossier ssl s'il n'existe pas
mkdir -p ssl

# Créer un fichier de configuration OpenSSL pour inclure les SAN (Subject Alternative Names)
cat > ssl/openssl.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=FR
ST=IDF
L=Paris
O=Development
OU=Dev
CN=$DOMAIN_NAME

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = $PUBLIC_IP
IP.3 = 172.17.0.1
IP.4 = 127.18.0.2
EOF

echo "📝 Configuration OpenSSL créée avec les adresses suivantes:"
echo "   - localhost"
echo "   - 127.0.0.1 (loopback)"
echo "   - $PUBLIC_IP (IP publique)"
echo "   - 172.17.0.1 (Docker bridge)"
echo "   - 127.18.0.2 (Docker interne)"
echo ""

echo "🔑 Génération de la clé privée..."
openssl genrsa -out ssl/key.pem 4096

echo "📜 Génération du certificat avec SAN..."
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -config ssl/openssl.conf -extensions v3_req

echo "🔒 Configuration des permissions..."
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo ""
echo "✅ Certificats générés avec succès!"
echo "   - ssl/key.pem (clé privée)"
echo "   - ssl/cert.pem (certificat public)"
echo "   - ssl/openssl.conf (configuration)"

echo ""
echo "🔍 Vérification du certificat:"
openssl x509 -in ssl/cert.pem -text -noout | grep -A 5 "Subject Alternative Name"

echo ""
echo "🌐 Tests d'accès distant recommandés:"
echo "   Depuis votre machine locale:"
echo "     curl -k https://localhost:3443/health"
echo ""
echo "   Depuis une machine distante:"
echo "     curl -k https://$PUBLIC_IP:3443/health"
echo "     curl -k https://$PUBLIC_IP:3443/network-info"
echo ""
echo "🔥 IMPORTANT: Vérifiez votre firewall!"
echo "   sudo ufw allow 3000"
echo "   sudo ufw allow 3443"
echo "   # ou"
echo "   sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT"
echo "   sudo iptables -A INPUT -p tcp --dport 3443 -j ACCEPT"