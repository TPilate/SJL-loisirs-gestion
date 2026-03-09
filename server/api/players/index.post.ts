import { Player } from '../../models/Player'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const player = await Player.create({
    name: body.name,
    rank: body.rank ?? 0,
  })

  return player
})
