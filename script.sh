#!/bin/bash

echo "🔥 NETTOYAGE COMPLET - Suppression de TOUT"

docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker system prune -a --volumes --force

echo "✅ Reset complet terminé!"
