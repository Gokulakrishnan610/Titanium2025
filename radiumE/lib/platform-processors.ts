/**
 * Platform-specific URL processing utilities
 */

import { VideoPlatform } from './video-types'

export interface YouTubeURLInfo {
  videoId: string
  startTime?: number
  playlistId?: string
  embedUrl: string
}

export interface InstagramURLInfo {
  postId: string
  type: 'post' | 'reel'
  embedUrl: string
}

/**
 * Enhanced YouTube URL processing with support for various formats and parameters
 */
export class YouTubeProcessor {
  private static readonly PATTERNS = [
    // Standard youtube.com watch URLs
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&t=(\d+))?/,
    // Short youtu.be URLs
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?t=(\d+))?/,
    // Embed URLs
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:\?start=(\d+))?/,
    // YouTube URLs with additional parameters
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})(?:.*&t=(\d+))?/
  ]

  static isYouTubeURL(url: string): boolean {
    return /(?:youtube\.com|youtu\.be)/i.test(url)
  }

  static extractVideoInfo(url: string): YouTubeURLInfo | null {
    if (!this.isYouTubeURL(url)) {
      return null
    }

    for (const pattern of this.PATTERNS) {
      const match = url.match(pattern)
      if (match && match[1]) {
        const videoId = match[1]
        const startTime = match[2] ? parseInt(match[2], 10) : undefined
        
        return {
          videoId,
          startTime,
          embedUrl: this.generateEmbedURL(videoId, { startTime })
        }
      }
    }

    return null
  }

  static generateEmbedURL(videoId: string, options: {
    autoplay?: boolean
    controls?: boolean
    startTime?: number
    privacyEnhanced?: boolean
  } = {}): string {
    const baseUrl = options.privacyEnhanced 
      ? 'https://www.youtube-nocookie.com/embed'
      : 'https://www.youtube.com/embed'
    
    const params = new URLSearchParams()
    
    if (options.autoplay) {
      params.set('autoplay', '1')
    }
    
    if (options.controls === false) {
      params.set('controls', '0')
    }
    
    if (options.startTime) {
      params.set('start', options.startTime.toString())
    }

    const queryString = params.toString()
    return `${baseUrl}/${videoId}${queryString ? `?${queryString}` : ''}`
  }

  static extractVideoId(url: string): string | null {
    const info = this.extractVideoInfo(url)
    return info ? info.videoId : null
  }
}

/**
 * Enhanced Instagram URL processing for posts and reels
 */
export class InstagramProcessor {
  private static readonly PATTERNS = [
    // Instagram post URLs
    /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
    // Instagram reel URLs  
    /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    // Instagram TV URLs
    /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/
  ]

  static isInstagramURL(url: string): boolean {
    return /instagram\.com/i.test(url)
  }

  static extractPostInfo(url: string): InstagramURLInfo | null {
    if (!this.isInstagramURL(url)) {
      return null
    }

    // Check for reel URLs first
    const reelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/)
    if (reelMatch && reelMatch[1]) {
      return {
        postId: reelMatch[1],
        type: 'reel',
        embedUrl: this.generateEmbedURL(reelMatch[1], 'reel')
      }
    }

    // Check for post URLs
    const postMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/)
    if (postMatch && postMatch[1]) {
      return {
        postId: postMatch[1],
        type: 'post',
        embedUrl: this.generateEmbedURL(postMatch[1], 'post')
      }
    }

    return null
  }

  static generateEmbedURL(postId: string, type: 'post' | 'reel' = 'post'): string {
    if (type === 'reel') {
      return `https://www.instagram.com/reel/${postId}/embed/`
    }
    return `https://www.instagram.com/p/${postId}/embed/`
  }

  static extractPostId(url: string): string | null {
    const info = this.extractPostInfo(url)
    return info ? info.postId : null
  }
}

/**
 * Generic platform processor factory
 */
export class PlatformProcessorFactory {
  static getProcessor(platform: VideoPlatform) {
    switch (platform) {
      case VideoPlatform.YOUTUBE:
        return YouTubeProcessor
      case VideoPlatform.INSTAGRAM:
        return InstagramProcessor
      default:
        return null
    }
  }

  static processURL(url: string, platform: VideoPlatform) {
    const processor = this.getProcessor(platform)
    if (!processor) {
      return null
    }

    switch (platform) {
      case VideoPlatform.YOUTUBE:
        return (processor as typeof YouTubeProcessor).extractVideoInfo(url)
      case VideoPlatform.INSTAGRAM:
        return (processor as typeof InstagramProcessor).extractPostInfo(url)
      default:
        return null
    }
  }
}

/**
 * Enhanced embed URL generation with platform-specific options
 */
export function generatePlatformEmbedURL(
  platform: VideoPlatform,
  videoId: string,
  options: Record<string, any> = {}
): string {
  switch (platform) {
    case VideoPlatform.YOUTUBE:
      return YouTubeProcessor.generateEmbedURL(videoId, options)
    case VideoPlatform.INSTAGRAM:
      return InstagramProcessor.generateEmbedURL(videoId, options.type || 'post')
    default:
      return ''
  }
}