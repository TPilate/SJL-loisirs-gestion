import { connectToDatabase } from '../utils/db'

/**
 * Runs before every API request.
 * Ensures a live MongoDB connection exists, handling cold starts and
 * dropped connections in serverless environments (e.g. Vercel).
 */
export default defineEventHandler(async (event) => {
  // Only enforce for /api routes
  if (!event.path.startsWith('/api')) {
    return
  }

  try {
    await connectToDatabase()
  } catch (error) {
    console.error('[MongoDB] Failed to connect before handling request:', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Database unavailable. Please try again later.',
    })
  }
})
