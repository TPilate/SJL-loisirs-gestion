export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: useRuntimeConfig().sessionPassword,
  })

  if (!session.data?.adminId) {
    return { isAdmin: false, username: null }
  }

  return { isAdmin: true, username: session.data.username }
})
