/**
 * URL parsing and platform detection utilities for video renderer
 */

import { VideoPlatform, ParsedVideoURL, PlatformConfig } from './video-types'
import { YouTubeProcessor, InstagramProcessor } from './platform-processors'

/**
 * Validates if a string is a valid URL format
 */
export function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitizes URL by removing potentially harmful characters and normalizing format
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  // Remove leading/trailing whitespace
  let sanitized = url.trim()
  
  // Add https:// if no protocol is specified
  if (!/^https?:\/\//i.test(sanitized)) {
    sanitized = `https://${sanitized}`
  }
  
  try {
    const urlObj = new URL(sanitized)
    // Return normalized URL
    return urlObj.toString()
  } catch {
    return ''
  }
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  return YouTubeProcessor.extractVideoId(url)
}

/**
 * Extracts Instagram post/reel ID from Instagram URLs
 */
function extractInstagramPostId(url: string): string | null {
  return InstagramProcessor.extractPostId(url)
}

/**
 * Platform configurations with patterns and extraction logic
 */
const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: VideoPlatform.YOUTUBE,
    patterns: [
      /(?:youtube\.com|youtu\.be)/i
    ],
    embedTemplate: 'https://www.youtube.com/embed/{videoId}',
    extractVideoId: extractYouTubeVideoId
  },
  {
    name: VideoPlatform.INSTAGRAM,
    patterns: [
      /instagram\.com/i
    ],
    embedTemplate: 'https://www.instagram.com/p/{videoId}/embed/',
    extractVideoId: extractInstagramPostId
  }
]

/**
 * Detects video platform from URL
 */
export function detectPlatform(url: string): VideoPlatform {
  if (!url || !isValidURL(url)) {
    return VideoPlatform.UNKNOWN
  }
  
  for (const config of PLATFORM_CONFIGS) {
    for (const pattern of config.patterns) {
      if (pattern.test(url)) {
        return config.name
      }
    }
  }
  
  return VideoPlatform.UNKNOWN
}

/**
 * Extracts video ID from URL based on platform
 */
export function extractVideoId(url: string, platform: VideoPlatform): string | null {
  const config = PLATFORM_CONFIGS.find(c => c.name === platform)
  if (!config) {
    return null
  }
  
  return config.extractVideoId(url)
}

/**
 * Generates embed URL for a given platform and video ID
 */
export function generateEmbedURL(platform: VideoPlatform, videoId: string, options: Record<string, any> = {}): string {
  switch (platform) {
    case VideoPlatform.YOUTUBE:
      return YouTubeProcessor.generateEmbedURL(videoId, options)
    case VideoPlatform.INSTAGRAM:
      return InstagramProcessor.generateEmbedURL(videoId, options.type || 'post')
    default:
      const config = PLATFORM_CONFIGS.find(c => c.name === platform)
      if (!config) {
        return ''
      }
      return config.embedTemplate.replace('{videoId}', videoId)
  }
}

/**
 * Main URL parser function that processes a video URL and returns parsed information
 */
export function parseVideoURL(url: string): ParsedVideoURL {
  const sanitizedUrl = sanitizeURL(url)
  
  if (!sanitizedUrl || !isValidURL(sanitizedUrl)) {
    return {
      platform: VideoPlatform.UNKNOWN,
      videoId: '',
      originalUrl: url,
      embedUrl: '',
      isValid: false
    }
  }
  
  const platform = detectPlatform(sanitizedUrl)
  
  if (platform === VideoPlatform.UNKNOWN) {
    return {
      platform: VideoPlatform.UNKNOWN,
      videoId: '',
      originalUrl: url,
      embedUrl: '',
      isValid: false
    }
  }
  
  const videoId = extractVideoId(sanitizedUrl, platform)
  
  if (!videoId) {
    return {
      platform,
      videoId: '',
      originalUrl: url,
      embedUrl: '',
      isValid: false
    }
  }
  
  const embedUrl = generateEmbedURL(platform, videoId)
  
  return {
    platform,
    videoId,
    originalUrl: url,
    embedUrl,
    isValid: true
  }
}

/**
 * URL Parser interface implementation
 */
export const URLParser = {
  parseURL: parseVideoURL,
  detectPlatform,
  extractVideoId
}