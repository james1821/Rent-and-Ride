import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

// Admin-only image upload. Files are written to the app server's disk
// (runtimeConfig.uploadDir, env UPLOAD_DIR) and served back from /uploads/*.
// No Firebase Storage is involved.
// multipart/form-data: `file`, optional `folder`.
const FOLDERS = ['popup', 'products', 'categories', 'banners']
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }
const MAX_BYTES = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts) return fail(400, 'Expected multipart/form-data')
  const file = parts.find((p) => p.name === 'file' && p.filename)
  if (!file) return fail(400, 'No file uploaded')

  const folderRaw = parts.find((p) => p.name === 'folder')?.data.toString() ?? 'popup'
  const folder = FOLDERS.includes(folderRaw) ? folderRaw : 'popup'

  const ext = TYPES[file.type ?? '']
  if (!ext) return fail(400, 'Only JPEG, PNG, WebP, AVIF or GIF images are allowed')
  if (file.data.length > MAX_BYTES) return fail(413, 'Image must be 5 MB or smaller')

  try {
    const root = resolve(useRuntimeConfig(event).uploadDir as string)
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
    await mkdir(join(root, folder), { recursive: true })
    await writeFile(join(root, folder, name), file.data)
    return ok({ url: `/uploads/${folder}/${name}`, path: `${folder}/${name}` }, 'Image uploaded')
  } catch (err: any) {
    return fail(500, err.message ?? 'Image upload failed')
  }
})
