import { Admin } from '../../models/Admin'

// First-run setup: creates the first admin account when no admin exists yet.
export default defineEventHandler(async (event) => {
  const count = await Admin.countDocuments()
  if (count > 0) {
    throw createError({ statusCode: 403, statusMessage: 'Setup already completed' })
  }

  const body = await readBody(event)
  if (!body.username || !body.password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })
  }

  const admin = await Admin.create({ username: body.username, password: body.password })
  return { ok: true, username: admin.username }
})
