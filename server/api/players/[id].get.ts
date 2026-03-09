import { Player } from '../../models/Player'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const player = await Player.findById(id)
  if (!player) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' })
  }

  return player
})
