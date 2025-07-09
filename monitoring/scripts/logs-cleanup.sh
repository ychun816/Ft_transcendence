#!/bin/bash

# Configuration
ELASTIC_URL="${ELASTIC_URL:-http://elasticsearch:9200}"
ELASTIC_USER="${ELASTIC_USER:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD}"
INDEX_PATTERN="transcendence-logs-*"
LOG_FILE="/var/log/transcendence-cleanup.log"
METRICS_FILE="/var/log/transcendence-cleanup-metrics.log"

# Fonction de logging avec timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fonction pour calculer l'âge d'un document en jours
calculate_age_days() {
    local doc_timestamp=$1
    local current_timestamp=$(date +%s)
    local doc_timestamp_seconds=$(date -d "$doc_timestamp" +%s)
    local age_seconds=$((current_timestamp - doc_timestamp_seconds))
    local age_days=$((age_seconds / 86400))
    echo $age_days
}

# Fonction pour supprimer les documents selon leurs critères de rétention
cleanup_by_retention() {
    local category=$1
    local retention_days=$2

    log_message "Nettoyage des logs de catégorie '$category' avec rétention de $retention_days jours"

    # Construire la requête de suppression
    local query='{j
        "query": {
            "bool": {
                "must": [
                    {"term": {"log_category": "'$category'"}},
                    {"range": {"@timestamp": {"lte": "now-'$retention_days'd"}}}
                ]
            }
        }
    }'

    # Compter d'abord les documents qui vont être supprimés
    local count_result=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
        -X POST "$ELASTIC_URL/$INDEX_PATTERN/_count" \
        -H "Content-Type: application/json" \
        -d "$query")

    local count=$(echo "$count_result" | grep -o '"count":[0-9]*' | cut -d':' -f2)

    if [ "$count" -gt 0 ]; then
        log_message "Suppression de $count documents de catégorie '$category'"

        # Effectuer la suppression
        local delete_result=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
            -X POST "$ELASTIC_URL/$INDEX_PATTERN/_delete_by_query" \
            -H "Content-Type: application/json" \
            -d "$query")

        # Extraire les métriques du résultat
        local deleted=$(echo "$delete_result" | grep -o '"deleted":[0-9]*' | cut -d':' -f2)
        local took=$(echo "$delete_result" | grep -o '"took":[0-9]*' | cut -d':' -f2)

        log_message "Suppression terminée: $deleted documents supprimés en ${took}ms"

        # Écrire les métriques pour Prometheus
        echo "transcendence_logs_deleted_total{category=\"$category\"} $deleted" >> "$METRICS_FILE"
        echo "transcendence_logs_cleanup_duration_ms{category=\"$category\"} $took" >> "$METRICS_FILE"
    else
        log_message "Aucun document à supprimer pour la catégorie '$category'"
    fi
}

# Fonction pour nettoyer les index vides
cleanup_empty_indices() {
    log_message "Recherche des index vides à supprimer"

    local indices=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
        "$ELASTIC_URL/_cat/indices/$INDEX_PATTERN?h=index,docs.count" | \
        awk '$2 == "0" {print $1}')

    for index in $indices; do
        log_message "Suppression de l'index vide: $index"
        curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
            -X DELETE "$ELASTIC_URL/$index"
    done
}

# Fonction pour calculer l'espace libéré
calculate_space_freed() {
    local before_size=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
        "$ELASTIC_URL/_cat/indices/$INDEX_PATTERN?h=store.size" | \
        awk '{sum += $1} END {print sum}')

    echo "$before_size"
}

# Fonction principale
main() {
    log_message "=== Début du nettoyage des logs ==="

    # Vérifier la connectivité à Elasticsearch
    if ! curl -s -u "$ELASTIC_USER:$ELASTIC_PASSWORD" "$ELASTIC_URL/_cluster/health" > /dev/null; then
        log_message "ERREUR: Impossible de se connecter à Elasticsearch"
        exit 1
    fi

    # Initialiser le fichier de métriques
    echo "# Métriques de nettoyage des logs - $(date)" > "$METRICS_FILE"

    # Calculer l'espace avant nettoyage
    local space_before=$(calculate_space_freed)

    # Nettoyer selon les catégories définies
    cleanup_by_retention "critical" 60    # Logs d'erreur : 90 jours
    cleanup_by_retention "important" 30   # Logs warn : 30 jours
    cleanup_by_retention "standard" 10    # Logs info : 30 jours
    cleanup_by_retention "temporary" 5    # Logs debug : 7 jours
    cleanup_by_retention "unknown" 30     # Logs sans catégorie : 30 jours

    # Nettoyer les index vides
    cleanup_empty_indices

    # Calculer l'espace après nettoyage
    local space_after=$(calculate_space_freed)
    local space_freed=$((space_before - space_after))

    log_message "Espace libéré: ${space_freed} bytes"
    echo "transcendence_logs_space_freed_bytes $space_freed" >> "$METRICS_FILE"

    log_message "=== Nettoyage terminé ==="
}

# Exécuter le script
main