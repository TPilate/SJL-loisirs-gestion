import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
  const session = await useSession(event, {
    password: useRuntimeConfig().sessionPassword,
  })
  if (!session.data?.adminId) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }
  return session.data
}
