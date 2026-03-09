import { Admin } from '../../models/Admin'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiants requis' })
  }

  const admin = await Admin.findOne({ username: username.toLowerCase() })
  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' })
  }

  const valid = await admin.comparePassword(password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' })
  }

  const session = await useSession(event, {
    password: useRuntimeConfig().sessionPassword,
    maxAge: 60 * 60 * 24,
  })
  await session.update({ adminId: admin._id.toString(), username: admin.username })

  return { ok: true, username: admin.username }
})
