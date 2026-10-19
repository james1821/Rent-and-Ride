import { uploadToCloudinary } from '../../utils/cloudinary'

const FOLDERS = ['popup', 'products', 'categories', 'banners']
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif'
}
// Serverless hosts (Vercel/Netlify) cap request bodies at ~4.5 MB, so keep the
// upload ceiling below that.
const MAX_BYTES = 4 * 1024 * 1024

// Admin image upload. Files are stored in Cloudinary (free tier) and the
// public HTTPS URL is persisted in Firestore. This keeps uploads visible from
// every environment — local disk does not survive serverless redeploys
// (Vercel/Netlify/Cloud Run have ephemeral filesystems).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts) return fail(400, 'No multipart form data received')

  const file = parts.find((p) => p.name === 'file' && p.filename)
  if (!file) return fail(400, 'No file received')

  const requestedFolder = parts.find((p) => p.name === 'folder')?.data?.toString()
  const folder = FOLDERS.includes(folderRequested ?? '') ? folderRequested! : 'popup'

  const mimeType = file.type ?? 'application/octet-stream'
  const ext = TYPES[mimeType]
  if (!ext) return fail(400, 'Only JPEG, PNG, WebP, AVIF or GIF images are allowed')
  if (file.data.length > MAX_BYTES) return fail(413, 'Image must be 4 MB or smaller')

  try {
    // Namespaced so every upload lands in <CLOUDINARY_FOLDER>/<folder>/.
    const result = await uploadToCloudinary(
      { data: file.data, filename: `upload.${ext}`, mimeType },
      folder,
      useRuntimeConfig(event).cloudinary
    )
    return ok({ url: result.url, publicId: result.publicId, path: result.publicId }, 'Image uploaded')
  } catch (err: any) {
    return fail(500, err?.message ?? 'Image upload failed')
  }
})
