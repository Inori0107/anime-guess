export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/room/')) {
    return
  }

  if (!import.meta.client) {
    return
  }

  const { getSession } = useGameSession()
  const session = getSession()

  if (!session) {
    return navigateTo('/join')
  }

  const code = String(to.params.code).toUpperCase()
  if (session.code !== code) {
    return navigateTo(`/room/${session.code}`)
  }
})
