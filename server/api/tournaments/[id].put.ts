import { Tournament } from '../../models/Tournament'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Validate name if provided
  if (body.name !== undefined && !body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament name is required' })
  }

  // Build update object — accept any subset of fields
  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name.trim()
  if (body.date !== undefined) update.date = body.date || null
  if (body.status !== undefined) update.status = body.status
  if (body.matchFormat !== undefined) update.matchFormat = body.matchFormat
  if (body.teamsPerPool !== undefined) update.teamsPerPool = body.teamsPerPool
  if (body.teams !== undefined) {
    update.teams = (body.teams as Array<{ _id?: string; name: string; playerIds: string[] }>).map(t => ({
      name: t.name,
      playerIds: t.playerIds,
      ...(t._id ? { _id: t._id } : {}),
    }))
  }
  if (body.pools !== undefined) {
    update.pools = (body.pools as Array<{ _id?: string; [key: string]: unknown }>).map(p => ({
      ...p,
      ...(p._id ? { _id: p._id } : { _id: undefined }),
    }))
  }

  const tournament = await Tournament.findByIdAndUpdate(id, update, {
    returnDocument: 'after',
    runValidators: true,
  })

  if (!tournament) {
    throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
  }

  return tournament
})
