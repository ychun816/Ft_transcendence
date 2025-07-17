import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collecte automatique système (CPU, mémoire, etc.)
// transcendence_  permet d'identifier facilement les métriques
collectDefaultMetrics({
    prefix: 'transcendence_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // Buckets pour mesurer le garbage collection
});

// Compteur pour le nombre total de requêtes HTTP
export const httpRequestsTotal = new Counter({
    name: 'transcendence_http_requests_total',
    help: 'Total number of HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'], // Labels pour filtrer et grouper
});

// Histogramme pour la durée des requêtes avec : count, sum, et buckets
export const httpRequestDuration = new Histogram({
    name: 'transcendence_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    // Ces buckets couvrent les temps de réponse typiques d'une application web
    buckets: [0.001, 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
});

// Gauge pour le nombre d'utilisateurs connectés
export const connectedUsers = new Gauge({
    name: 'transcendence_connected_users',
    help: 'Number of currently connected users',
});

// Compteur pour les erreurs de l'application
export const applicationErrors = new Counter({
    name: 'transcendence_application_errors_total',
    help: 'Total number of application errors',
    labelNames: ['type', 'severity', 'route'],
});

// Compteur pour les requêtes de signup
export const signupRequests = new Counter({
    name: 'transcendence_signup_requests_total',
    help: 'Total number of signup requests',
    labelNames: ['status'], // 'success' ou 'failure'
});

// Compteur pour les requêtes de login
export const loginRequests = new Counter({
    name: 'transcendence_login_requests_total',
    help: 'Total number of login requests',
    labelNames: ['status'],
});

// Fonction pour obtenir toutes les métriques au format Prometheus
export const getMetrics = async () => {
    return await register.metrics();
};

// Fonction pour réinitialiser les métriques
export const clearMetrics = () => {
    register.clear();
};

// Fonction pour incrémenter les métriques de requête HTTP
export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
    const labels = {
        method: method.toUpperCase(),
        route: route || 'unknown',
        status_code: statusCode.toString(),
    };

    // Incrémenter le compteur de requêtes
    httpRequestsTotal.inc(labels);

    // Enregistrer la durée de la requête
    httpRequestDuration.observe(labels, duration);
};

// Fonction pour enregistrer les erreurs
export const recordError = (type: string, severity: string, route: string) => {
    applicationErrors.inc({
        type,
        severity,
        route: route || 'unknown',
    });
};
