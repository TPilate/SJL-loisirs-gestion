import { connectToDatabase } from '../utils/db'

export default defineNitroPlugin(async () => {
  try {
    await connectToDatabase()
  } catch (error) {
    // Log but don't crash the server — the middleware will retry on each request
    console.error('[MongoDB] Initial connection failed:', error)
  }
})
