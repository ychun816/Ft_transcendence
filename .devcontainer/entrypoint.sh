#!/bin/bash
# Entrypoint pour détection automatique de l'IP au runtime

# Détection de l'IP de la machine hôte
if [ -z "$PUBLIC_IP" ]; then
    # Essayer de récupérer l'IP depuis l'intérieur du conteneur
    PUBLIC_IP=$(ip route show default | awk '/default/ {print $3}' 2>/dev/null)
    
    # Si ça ne marche pas, utiliser l'IP locale
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP="127.0.0.1"
    fi
    
    export PUBLIC_IP
    echo "IP détectée automatiquement: $PUBLIC_IP"
fi

# Lancer la commande originale
exec "$@"