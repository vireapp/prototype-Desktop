export interface YouTubeVideo {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    description: string
    thumbnails: {
      high: {
        url: string
      }
    }
    channelTitle: string
  }
}

export async function searchYouTube(
  query: string,
  regionCode: string = 'US',
  categoryId?: string
): Promise<YouTubeVideo[]> {
  try {
    let items = []
    if (query) {
      items = await (window as any).api.youtubeSearch(query)
    } else {
      items = await (window as any).api.youtubePopular(regionCode, categoryId)
    }

    // Normalize 'videos' endpoint response to match 'search' format
    return items.map((item: any) => ({
      ...item,
      id: typeof item.id === 'string' ? { videoId: item.id } : item.id
    }))
  } catch (error) {
    console.error('Failed to fetch from YouTube (via IPC):', error)
    return []
  }
}
