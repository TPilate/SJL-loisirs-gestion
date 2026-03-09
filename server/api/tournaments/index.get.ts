import { Tournament } from '../../models/Tournament'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean()
  return tournaments
})
