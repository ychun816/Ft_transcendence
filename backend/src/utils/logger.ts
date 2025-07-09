import pino from 'pino';
import net from 'net';

const sendToLogstash = async (logData: any): Promise<void> => {
	try {
		const logstashHost = process.env.LOGSTASH_HOST || 'logstash';
		const logstashPort = parseInt(process.env.LOGSTASH_PORT || '5044');

    const logEntry = {
      ...logData,
      '@timestamp': new Date().toISOString(),
      service: 'transcendence',
      environment: process.env.NODE_ENV || 'development'
    };

    const client = new net.Socket();

    client.connect(logstashPort, logstashHost, () => {
      client.write(JSON.stringify(logEntry) + '\n');
      client.end();
    });

    client.on('error', (error) => {
      console.error('Failed to send log to Logstash:', error.message);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send log to Logstash:', errorMessage);
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


const RETENTION_POLICY = {
	error: { days: 60, category: 'critical' },
	warn: { days: 30, category: 'important' },
	info: { days: 10, category: 'standard' },
	debug: { days: 5, category: 'temporary' },
}
export const logger = {
  info: (message: string | object) => {
    const logData = typeof message === 'string'
		? {
			level: 'info',
			message,
			retention: RETENTION_POLICY.info,
			index_pattern: 'logs-info'
		}
		: {
			level: 'info',
			message: JSON.stringify(message),
			retention: RETENTION_POLICY.info,
			index_pattern: 'logs-info',
			...message
		};

    pinoLogger.info(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  error: (message: string | object) => {
    const logData = typeof message === 'string'
		? {
			level: 'error',
			message,
			retention: RETENTION_POLICY.error,
			index_pattern: 'logs-error'
		}
		: {
			level: 'error',
			message: JSON.stringify(message),
			retention: RETENTION_POLICY.error,
			index_pattern: 'logs-error',
			...message
		};

    pinoLogger.error(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  warn: (message: string | object) => {
    const logData = typeof message === 'string'
		? {
			level: 'warn',
			message,
			retention: RETENTION_POLICY.warn,
			index_pattern: 'logs-warn'
		}
		: {
			level: 'warn',
			message: JSON.stringify(message),
			retention: RETENTION_POLICY.warn,
			index_pattern: 'logs-warn',
			...message
		};

    pinoLogger.warn(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  debug: (message: string | object) => {
    const logData = typeof message === 'string'
		? {
			level: 'debug',
			message,
			retention: RETENTION_POLICY.debug,
			index_pattern: 'logs-debug'
		}
		: {
			level: 'debug',
			message: JSON.stringify(message),
			retention: RETENTION_POLICY.debug,
			index_pattern: 'logs-debug',
			...message
		};

    pinoLogger.debug(logData);
    setImmediate(() => sendToLogstash(logData));
  }
};

// Version encore plus simple
export const log = (message: string | object) => {
  logger.info(message);
};