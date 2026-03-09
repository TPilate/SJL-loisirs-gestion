import { Tournament } from '../../models/Tournament'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const tournament = await Tournament.findByIdAndDelete(id)
  if (!tournament) {
    throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
  }

  return { success: true }
})
