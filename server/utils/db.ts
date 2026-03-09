import mongoose from 'mongoose'

// Disable buffering globally — queries will throw immediately if not connected
// instead of silently queuing and timing out after 10s in serverless environments
mongoose.set('bufferCommands', false)

// Cache the connection promise to avoid multiple simultaneous connection attempts
let connectionPromise: Promise<typeof mongoose> | null = null

export async function connectToDatabase(): Promise<void> {
  // Already connected — reuse the existing connection
  if (mongoose.connection.readyState === 1) {
    return
  }

  // Connection is being established — wait for it
  if (connectionPromise) {
    await connectionPromise
    return
  }

  const config = useRuntimeConfig()
  const uri = config.mongodbUri

  if (!uri) {
    throw new Error('[MongoDB] MONGODB_URI is not defined in runtime config')
  }

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
  })

  try {
    await connectionPromise
    console.log('[MongoDB] Connected successfully')
  } catch (error) {
    // Reset so the next request can retry
    connectionPromise = null
    console.error('[MongoDB] Connection failed:', error)
    throw error
  }
}
