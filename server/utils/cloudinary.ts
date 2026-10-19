// Minimal unsigned-upload client for Cloudinary's REST API.
// Uses an *unsigned* upload preset, so only the cloud name and preset name are
// needed — no API key or API secret. We deliberately avoid the `cloudinary` SDK
// so the Nitro server bundle stays small and dependency-free (Node 18+'s global
// fetch/FormData/Blob are enough).

export interface CloudinaryConfig {
  cloudName?: string
  /** Name of an unsigned upload preset (Cloudinary → Settings → Upload). */
  uploadPreset?: string
  /** Optional top-level folder all uploads are grouped under. */
  folder?: string
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

export async function uploadToCloudinary(
  file: { data: Buffer, filename: string, mimeType: string },
  folder: string,
  config: CloudinaryConfig
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = config
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.')
  }

  const targetFolder = [config.folder, folder].filter(Boolean).join('/')

  const form = new FormData()
  form.append('file', new Blob([file.data], { type: file.mimeType }), file.filename)
  form.append('upload_preset', uploadPreset)
  // Unsigned uploads accept a `folder`; if the preset pins its own folder,
  // Cloudinary ignores/uses that instead.
  if (targetFolder) form.append('folder', targetFolder)

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
