import { createClient } from '@supabase/supabase-js'

const LOGGER_SINGLETON_KEY = '__team3LoggerSingleton'
const LOGGER_HANDLERS_KEY = '__team3LoggerShutdownHandlers'

class Logger {
    constructor() {
        this.batch = []
        this.batchSize = 25 // Reduced from 100 for more frequent flushes
        this.flushInterval = 5000 // Flush every 5 seconds
        this.isShuttingDown = false
        this.supabase = null

        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            )
        }

        this.startPeriodicFlush()

        this.setupShutdownHandlers()
    }

    /**
     * Add a log entry to the batch
     * @param {Object} logEntry - The log entry to add
     * @param {string} logEntry.level - Log level: 'info', 'warning', or 'error'
     * @param {string} logEntry.endpoint - Request endpoint/path
     * @param {number} logEntry.status_code - HTTP status code
     * @param {string} logEntry.message - Log message
     * @param {string} logEntry.user_id - User ID (optional)
     * @param {Object} logEntry.metadata - Additional metadata (optional)
     */
    log({ level, endpoint, status_code, message, user_id = null, metadata = null }) {
        if (!this.supabase) {
            return
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            endpoint,
            status_code,
            message,
            user_id,
            metadata
        }

        this.batch.push(logEntry)

        if (this.batch.length >= this.batchSize) {
            this.flush()
        }
    }


    async flush() {
        if (this.batch.length === 0 || !this.supabase) {
            return
        }

        const logsToFlush = [...this.batch]
        this.batch = []

        try {
            const { error } = await this.supabase
                .from('logs')
                .insert(logsToFlush)

            if (error) {
                this.batch.unshift(...logsToFlush)
            }
        } catch (err) {
            this.batch.unshift(...logsToFlush)
        }
    }


    startPeriodicFlush() {
        this.flushTimer = setInterval(() => {
            if (!this.isShuttingDown) {
                this.flush()
            }
        }, this.flushInterval)
        if (this.flushTimer.unref) {
            this.flushTimer.unref()
        }
    }

    stopPeriodicFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer)
            this.flushTimer = null
        }
    }

    setupShutdownHandlers() {
        if (typeof process === 'undefined' || typeof process.on !== 'function') {
            return
        }

        if (globalThis[LOGGER_HANDLERS_KEY]) {
            return
        }

        const shutdown = async () => {
            const activeLogger = globalThis[LOGGER_SINGLETON_KEY]

            if (!activeLogger) {
                process.exit(0)
                return
            }

            activeLogger.isShuttingDown = true
            activeLogger.stopPeriodicFlush()
            await activeLogger.flush()
            process.exit(0)
        }

        process.once('SIGINT', shutdown)
        process.once('SIGTERM', shutdown)
        globalThis[LOGGER_HANDLERS_KEY] = true
    }


    info({ endpoint, status_code, message, user_id = null, metadata = null }) {
        this.log({ level: 'info', endpoint, status_code, message, user_id, metadata })
    }

    warning({ endpoint, status_code, message, user_id = null, metadata = null }) {
        this.log({ level: 'warning', endpoint, status_code, message, user_id, metadata })
    }

    error({ endpoint, status_code, message, user_id = null, metadata = null }) {
        this.log({ level: 'error', endpoint, status_code, message, user_id, metadata })
    }
}

const logger = globalThis[LOGGER_SINGLETON_KEY] || new Logger()

if (!globalThis[LOGGER_SINGLETON_KEY]) {
    globalThis[LOGGER_SINGLETON_KEY] = logger
}

export default logger
