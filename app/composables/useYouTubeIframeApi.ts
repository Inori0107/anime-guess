type YouTubePlayer = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

type YouTubePlayerConstructor = new (
  elementId: string,
  options: {
    height: string
    width: string
    videoId: string
    playerVars?: Record<string, number | string>
    events?: {
      onReady?: () => void
      onError?: () => void
    }
  },
) => YouTubePlayer

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiReadyPromise: Promise<void> | null = null

export const useYouTubeIframeApi = () => {
  const loadApi = (): Promise<void> => {
    if (!import.meta.client) {
      return Promise.resolve()
    }

    if (window.YT?.Player) {
      return Promise.resolve()
    }

    if (!apiReadyPromise) {
      apiReadyPromise = new Promise((resolve, reject) => {
        const previousReady = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          previousReady?.()
          resolve()
        }

        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const script = document.createElement('script')
          script.src = 'https://www.youtube.com/iframe_api'
          script.async = true
          script.onerror = () => reject(new Error('無法載入 YouTube API'))
          document.head.appendChild(script)
        }
      })
    }

    return apiReadyPromise
  }

  const createPlayer = async (
    elementId: string,
    videoId: string,
    events?: {
      onReady?: () => void
      onError?: () => void
    },
  ): Promise<YouTubePlayer> => {
    await loadApi()

    if (!window.YT?.Player) {
      throw new Error('YouTube API 未就緒')
    }

    return new window.YT.Player(elementId, {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events,
    })
  }

  return { loadApi, createPlayer }
}
