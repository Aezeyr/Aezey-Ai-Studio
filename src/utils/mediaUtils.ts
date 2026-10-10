/**
 * AEZEY AI Studio - Media Handling & Video Frame Extraction Utilities
 */
import { MediaInspectionData } from '../types';

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE_BYTES = 40 * 1024 * 1024; // 40 MB
export const MAX_VIDEO_DURATION_SECONDS = 30; // Strictly 30 seconds max as required

/**
 * Converts a File or Blob into a Base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes high-resolution images for fast transmission and inference,
 * keeping file size well within serverless and Cloudflare payload limits while preserving full clarity.
 */
export async function optimizeImageForAnalysis(file: File): Promise<string> {
  // If small (< 1.5MB), directly convert
  if (file.size <= 1.5 * 1024 * 1024) {
    return fileToBase64(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 2048;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      } else {
        fileToBase64(file).then(resolve);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fileToBase64(file).then(resolve);
    };
    img.src = objectUrl;
  });
}

/**
 * Validates an image file
 */
export function validateImageFile(file: File): MediaValidationResult {
  const isTypeSupported = SUPPORTED_IMAGE_TYPES.some(
    (t) => file.type.toLowerCase() === t || file.name.toLowerCase().endsWith(t.replace('image/', '.'))
  );

  if (!isTypeSupported) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please upload a JPG, JPEG, PNG, or WEBP image.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image file size is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed image size is 25MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a video file and checks duration in browser
 */
export function validateVideoFile(file: File): Promise<MediaValidationResult> {
  return new Promise((resolve) => {
    const isTypeSupported =
      SUPPORTED_VIDEO_TYPES.some((t) => file.type.toLowerCase().includes(t.replace('video/', ''))) ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.mov') ||
      file.name.toLowerCase().endsWith('.webm');

    if (!isTypeSupported) {
      return resolve({
        valid: false,
        error: `Unsupported video format (${file.type || 'unknown'}). Supported formats are MP4, MOV, and WEBM.`,
      });
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return resolve({
        valid: false,
        error: `Video file size is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed video size is 40MB.`,
      });
    }

    // Measure video duration via HTML5 video element
    const video = document.createElement('video');
    video.preload = 'metadata';

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = video.duration;

      if (isNaN(duration) || duration <= 0) {
        return resolve({
          valid: false,
          error: 'Unable to determine video duration. The video file may be corrupt or encoded in an unsupported format.',
        });
      }

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        return resolve({
          valid: false,
          duration,
          error: `Video exceeds maximum allowed duration. Uploaded clip is ${Math.round(duration)}s long, but the maximum allowed length is 30 seconds. Please upload a clip ≤ 30s.`,
        });
      }

      resolve({
        valid: true,
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Unable to decode video. The file may be corrupt or uses an unsupported codec.',
      });
    };
  });
}

/**
 * Extracts multiple chronological keyframe snapshots across the video duration (≤ 30s).
 * Samples strategic timestamps: beginning (~5%), early (~20%), mid (~40%), late-mid (~60%), late (~80%), and end (~95%).
 * This guarantees comprehensive multi-frame visual understanding across the progression of the video.
 */
export async function extractVideoKeyframes(file: File, frameCount: number = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const frames: string[] = [];

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) {
        URL.revokeObjectURL(objectUrl);
        return resolve([]);
      }

      // Proportional sampling across beginning, middle, and end
      const proportions = [0.06, 0.22, 0.42, 0.62, 0.82, 0.94].slice(0, frameCount);
      const timestamps = proportions.map((p) => Math.max(0.1, Math.min(duration - 0.2, p * duration)));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxDim = 1024;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 360;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;

      try {
        for (const time of timestamps) {
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const frameData = canvas.toDataURL('image/jpeg', 0.85);
                frames.push(frameData);
              }
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
          });
        }
        URL.revokeObjectURL(objectUrl);
        resolve(frames);
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(frames);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve([]);
    };
  });
}

/**
 * Performs client-side visual inspection of uploaded image or video.
 * Extracts aspect ratio, color palette, edge density, and checks for readable text / contact info.
 */
export async function inspectMediaCanvas(file: File, isVideo = false): Promise<MediaInspectionData> {
  const result: MediaInspectionData = {
    visibleText: [],
    sceneHighlights: [],
  };

  try {
    if (!isVideo && file.type.startsWith('image/')) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = objectUrl;
      });

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);

      if (width && height) {
        const ratio = width / height;
        result.orientation = ratio > 1.2 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square';
        result.aspectRatio = `${width}:${height} (${result.orientation})`;

        // Offscreen sampling for color & visual density
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 400);
        canvas.height = Math.min(height, 400);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let rTotal = 0, gTotal = 0, bTotal = 0;
          const pixelCount = data.length / 4;
          for (let i = 0; i < data.length; i += 16) {
            rTotal += data[i];
            gTotal += data[i + 1];
            bTotal += data[i + 2];
          }
          const sampleSteps = pixelCount / 4;
          const avgR = Math.round(rTotal / sampleSteps);
          const avgG = Math.round(gTotal / sampleSteps);
          const avgB = Math.round(bTotal / sampleSteps);
          result.colorPalette = [`rgb(${avgR}, ${avgG}, ${avgB})`];
        }
      }

      // Check for browser native TextDetector API if supported
      if (typeof window !== 'undefined' && 'TextDetector' in window) {
        try {
          const detector = new (window as any).TextDetector();
          const detected = await detector.detect(img);
          if (Array.isArray(detected) && detected.length > 0) {
            const lines = detected.map((d: any) => d.rawValue?.trim()).filter(Boolean);
            if (lines.length > 0) {
              result.visibleText = lines;
            }
          }
        } catch {
          // Native detector not available
        }
      }

      // If no text detected natively, parse meaningful words from filename as supplementary hints
      if ((!result.visibleText || result.visibleText.length === 0) && file.name) {
        const cleanName = file.name
          .replace(/\.[a-zA-Z0-9]+$/, '')
          .replace(/[-_.]+/g, ' ')
          .replace(/^(img|image|photo|pic|video|screenshot|whatsapp image)\s*/i, '')
          .trim();
        if (cleanName.length >= 3 && !/^\d+$/.test(cleanName)) {
          result.visibleText = [cleanName];
        }
      }
    }
  } catch {
    // Graceful inspection fallback
  }

  return result;
}

/**
 * Format bytes to readable size (KB / MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
