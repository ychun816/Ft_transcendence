#!/bin/bash

# Colors
RED="\033[1;31m"
YELLOW="\033[1;33m"
GREEN="\033[1;32m"
RESET="\033[0m"

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${RESET} $1";}

log_warn() { echo -e "${YELLOW}[WARN]${RESET} $1";}

log_error() { echo -e "${RED}[ERROR]${RESET} $1";}

is_running_in_docker() {
    grep -qE '/docker|/lxc' /proc/1/cgroup 2>/dev/null || [ -f /.dockerenv ]
}

# Get the best matching 10.x.x.x IP
get_best_ip() {
    ip a | grep 'inet 10\.' | awk '{print $2}' | cut -d/ -f1 | head -n 1
}

# Main logic
main() {
    if is_running_in_docker; then
        log_error "Ce script ne doit pas être exécuté depuis un conteneur Docker."
        exit 1
    fi

    detected_ip=$(get_best_ip)

    if [[ -z "$detected_ip" ]]; then
        log_warn "Aucune IP 10.x.x.x détectée. Utilisation de l'adresse locale par défaut (127.0.0.1)."
        detected_ip="127.0.0.1"
    else
        log_info "IP 10.x détectée : $detected_ip"
    fi

    SSL_DIR="backend/ssl"
    CNF_FILE="$SSL_DIR/openssl.conf"
    CERT_KEY="$SSL_DIR/key.pem"
    CERT_PEM="$SSL_DIR/cert.pem"

    mkdir -p "$SSL_DIR"

    cat > "$CNF_FILE" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C=FR
ST=Ile-de-France
L=Paris
O=Production
OU=TransApp
CN=localhost

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ${detected_ip}
EOF

    log_info "Fichier OpenSSL généré : $CNF_FILE"

    # Génération du certificat seulement s'il n'existe pas
    if [[ ! -f "$CERT_KEY" || ! -f "$CERT_PEM" ]]; then
        log_info "Génération du certificat SSL..."

        openssl req -x509 -nodes -days 365 \
            -newkey rsa:2048 \
            -keyout "$CERT_KEY" \
            -out "$CERT_PEM" \
            -config "$CNF_FILE"

        log_info "Certificat généré dans $SSL_DIR/"
    else
        log_info "Certificat SSL déjà existant, aucune génération nécessaire."
    fi

    echo
    log_info "Lancement de Docker Compose avec PUBLIC_IP=$detected_ip ..."
    PUBLIC_IP="$detected_ip" docker compose -f .devcontainer/docker-compose.yml up -d && docker exec -it trans-dev bash
}

main "$@"
