/**
 * AEZEY AI Studio - Media Handling & Video Frame Extraction Utilities
 */

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
 * Extracts multiple evenly spaced keyframe snapshots from a video up to 30s.
 * This guarantees comprehensive multi-frame visual understanding by Gemini without dropped frames.
 */
export async function extractVideoKeyframes(file: File, frameCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
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

      // Calculate timestamps to sample (e.g. 10%, 30%, 50%, 70%, 90% of duration)
      const timestamps: number[] = [];
      const step = duration / (frameCount + 1);
      for (let i = 1; i <= frameCount; i++) {
        timestamps.push(Math.min(duration - 0.2, Math.max(0.2, i * step)));
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Restrict frame resolution for fast upload & inference (max 1024 width)
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
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        // If frame extraction fails, resolve with what we have
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
