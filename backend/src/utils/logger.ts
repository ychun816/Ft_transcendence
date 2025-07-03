import pino from 'pino';
import { Client } from '@elastic/elasticsearch';

const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  tls: {
    rejectUnauthorized: false
  }
});

const sendToElasticsearch = async (logData: any): Promise<void> => {
  try {
    const response = await elasticsearchClient.index({
      index: `transcendence-logs-${new Date().toISOString().split('T')[0]}`,
      body: {
        ...logData,
        '@timestamp': new Date().toISOString(),
        service: 'transcendence',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send log to Elasticsearch:', errorMessage);
  }
};

const pinoLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export const logger = {
  info: (message: string, extra?: Record<string, any>) => {
    const logData = { level: 'info', message, ...extra };
    pinoLogger.info(logData);
    setImmediate(() => sendToElasticsearch(logData));
  },
  error: (message: string, extra?: Record<string, any>) => {
    const logData = { level: 'error', message, ...extra };
    pinoLogger.error(logData);
    setImmediate(() => sendToElasticsearch(logData));
  },
  warn: (message: string, extra?: Record<string, any>) => {
    const logData = { level: 'warn', message, ...extra };
    pinoLogger.warn(logData);
    setImmediate(() => sendToElasticsearch(logData));
  },
  debug: (message: string, extra?: Record<string, any>) => {
    const logData = { level: 'debug', message, ...extra };
    pinoLogger.debug(logData);
    setImmediate(() => sendToElasticsearch(logData));
  }
};