import { createHash } from 'node:crypto'

// Minimal signed-upload client for Cloudinary's REST API.
// We deliberately avoid the `cloudinary` SDK so the Nitro server bundle stays
// small and dependency-free — Node 18+'s global fetch/FormData/Blob are enough.

export interface CloudinaryConfig {
  cloudName?: string
  apiKey?: string
  apiSecret?: string
  /** Optional top-level folder all uploads are grouped under. */
  folder?: string
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

// Cloudinary signs the request by sorting the parameters alphabetically,
// joining them as `key=value&...`, appending the API secret, then SHA-1 hashing.
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex')
}

export async function uploadToCloudinary(
  file: { data: Buffer, filename: string, mimeType: string },
  folder: string,
  config: CloudinaryConfig
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = config
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  }

  const targetFolder = [config.folder, folder].filter(Boolean).join('/')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const form = new FormData()
  form.append('file', new Blob([file.data], { type: file.mimeType }), file.filename)
  form.append('api_key', apiKey)
  form.append('timestamp', timestamp)
  if (targetFolder) form.append('folder', targetFolder)
  form.append('signature', sign(targetFolder ? { folder: targetFolder, timestamp } : { timestamp }, apiSecret))

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form
  })

  const payload: any = await res.json().catch(() => null)
  if (!res.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`)
  }

  return { url: payload.secure_url as string, publicId: payload.public_id as string }
}
