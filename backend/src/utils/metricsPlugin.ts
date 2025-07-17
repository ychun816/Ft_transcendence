import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { getMetrics, recordHttpRequest, recordError } from './metrics.js';

// Interface pour étendre les propriétés de la requête Fastify
// Cela nous permet d'ajouter des propriétés personnalisées à chaque requête
declare module 'fastify' {
    interface FastifyRequest {
        metricsStartTime?: number;
    }
}

// plugin Fastify : fonction qui reçoit l'instance Fastify et des options
export const metricsPlugin = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    // StartTime request
    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        request.metricsStartTime = Date.now();
    });

    // Collecte les métriques de performance
    fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        // Duration request in seconds
        const duration = request.metricsStartTime
            ? (Date.now() - request.metricsStartTime) / 1000
            : 0;

        // Extraire les informations nécessaires pour les métriques
        const method = request.method;
        const route = request.routeOptions?.url || request.url;
        const statusCode = reply.statusCode;

        // Enregistrer les métriques HTTP
        recordHttpRequest(method, route, statusCode, duration);
    });

    // Compter et catégoriser les erreurs
    fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
        // Déterminer le type d'erreur et sa gravité
        const errorType = error.constructor.name || 'UnknownError';
        const severity = reply.statusCode >= 500 ? 'critical' : 'warning';
       const route = request.routeOptions?.url || request.url;

        // Enregistrer l'erreur dans les métriques
        recordError(errorType, severity, route);
    });

    // Route pour exposer les métriques à Prometheus
    // Cette route doit être accessible par Prometheus pour scraper les métriques
    fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Récupérer toutes les métriques au format Prometheus
            const metrics = await getMetrics();

            // Définir le Content-Type approprié pour Prometheus
            // Prometheus attend un format texte spécifique avec cette version
            reply.type('text/plain; version=0.0.4; charset=utf-8');

            return metrics;
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques:', error);
            reply.code(500);
            return 'Erreur interne du serveur';
        }
    });

    // // Route de santé (health check) - optionnelle mais recommandée
    // // Cette route permet de vérifier rapidement si l'application est en vie
    // fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    //     return {
    //         status: 'OK',
    //         timestamp: new Date().toISOString(),
    //         uptime: process.uptime()
    //     };
    // });
};

// Fonction pour mettre à jour manuellement certaines métriques
// Par exemple, pour mettre à jour le nombre d'utilisateurs connectés
export const updateConnectedUsers = (count: number) => {
    const { connectedUsers } = require('./metrics.js');
    connectedUsers.set(count);
};

// Fonction pour enregistrer des événements métier spécifiques
export const recordBusinessEvent = (event: string, labels: Record<string, string> = {}) => {
    const { signupRequests, loginRequests } = require('./metrics.js');

    switch (event) {
        case 'signup_success':
            signupRequests.inc({ status: 'success' });
            break;
        case 'signup_failure':
            signupRequests.inc({ status: 'failure' });
            break;
        case 'login_success':
            loginRequests.inc({ status: 'success' });
            break;
        case 'login_failure':
            loginRequests.inc({ status: 'failure' });
            break;
        default:
            console.warn(`Événement métier non reconnu: ${event}`);
    }
};
