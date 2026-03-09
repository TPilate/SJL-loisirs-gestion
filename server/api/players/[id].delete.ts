import { Player } from '../../models/Player'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const player = await Player.findByIdAndDelete(id)
  if (!player) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' })
  }

  return { success: true }
})
