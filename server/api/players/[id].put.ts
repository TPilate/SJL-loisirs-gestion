import { Player } from '../../models/Player'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const player = await Player.findByIdAndUpdate(
    id,
    { name: body.name, firstName: body.firstName ?? '', rank: body.rank ?? 'Bronze', blocked: body.blocked ?? false, points: body.points ?? 5 },
    { new: true, runValidators: true }
  )

  if (!player) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' })
  }

  return player
})
