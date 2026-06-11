export const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim())

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null
    }

    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtube-nocookie.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }
      const pathMatch = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/)
      if (pathMatch) {
        return pathMatch[2] || null
      }
    }

    return null
  }
  catch {
    return null
  }
}
