/**
 * Core types and interfaces for video URL rendering system
 */

export enum VideoPlatform {
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  UNKNOWN = 'unknown'
}

export interface ParsedVideoURL {
  platform: VideoPlatform
  videoId: string
  originalUrl: string
  embedUrl: string
  isValid: boolean
}

export interface VideoError {
  type: 'INVALID_URL' | 'PLATFORM_NOT_SUPPORTED' | 'NETWORK_ERROR' | 'EMBED_FAILED'
  message: string
  platform?: VideoPlatform
  originalUrl: string
}

export interface PlatformConfig {
  name: VideoPlatform
  patterns: RegExp[]
  embedTemplate: string
  extractVideoId: (url: string) => string | null
}

export interface VideoRendererProps {
  url: string
  className?: string
  autoplay?: boolean
  controls?: boolean
  width?: string | number
  height?: string | number
  onError?: (error: VideoError) => void
  onLoad?: () => void
}

export interface YouTubeEmbedProps {
  videoId: string
  autoplay?: boolean
  controls?: boolean
  className?: string
  onError?: (error: Error) => void
  onLoad?: () => void
}

export interface InstagramEmbedProps {
  postId: string
  className?: string
  onError?: (error: Error) => void
  onLoad?: () => void
}

export interface ErrorFallbackProps {
  error: VideoError
  originalUrl: string
  onRetry?: () => void
  className?: string
}