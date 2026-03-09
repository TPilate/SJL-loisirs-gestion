import { Tournament } from '../../models/Tournament'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament name is required' })
  }

  const tournament = await Tournament.create({
    name: body.name.trim(),
    date: body.date || undefined,
    matchFormat: {
      setsToWin: body.matchFormat?.setsToWin ?? 2,
      pointsPerSet: body.matchFormat?.pointsPerSet ?? 25,
      goldenSetPoints: body.matchFormat?.goldenSetPoints ?? 15,
    },
    teamsPerPool: body.teamsPerPool ?? 4,
  })

  return tournament
})
