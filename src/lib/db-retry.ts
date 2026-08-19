import { Prisma } from "@prisma/client"

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017"])
const RETRYABLE_MESSAGES = [
    "Can't reach database server",
    "Connection terminated",
    "connection refused",
    "Timed out",
]

function isRetryableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientInitializationError) return true
    if (error instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(error.code)) return true
    if (error instanceof Error && RETRYABLE_MESSAGES.some(m => error.message.includes(m))) return true
    return false
}

interface RetryOptions {
    retries?: number
    delayMs?: number
}

// Reintenta operaciones de Prisma ante fallos transitorios de conexión (ej: cold start de DB free tier)
export async function withDbRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const retries = options.retries ?? 3
    const delayMs = options.delayMs ?? 500

    let lastError: unknown
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            if (!isRetryableError(error) || attempt === retries) throw error
            await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
        }
    }
    throw lastError
}
