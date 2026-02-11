import { createClient } from '@supabase/supabase-js'

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
    
        const shutdown = async () => {
            this.isShuttingDown = true
            this.stopPeriodicFlush()
            await this.flush()
            process.exit(0)
        }
    
        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)
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

const logger = new Logger()

export default logger
