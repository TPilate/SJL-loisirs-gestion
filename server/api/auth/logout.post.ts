export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: useRuntimeConfig().sessionPassword,
  })
  await session.clear()
  return { ok: true }
})
