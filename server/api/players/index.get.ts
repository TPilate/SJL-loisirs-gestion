import { Player } from '../../models/Player'

export default defineEventHandler(async () => {
  const players = await Player.find().sort({ rank: 1 })
  return players
})
