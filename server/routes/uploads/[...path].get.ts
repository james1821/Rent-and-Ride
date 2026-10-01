import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

// Serves admin-uploaded images from the upload directory (see upload-image.post.ts).
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif'
}

export default defineEventHandler(async (event) => {
  const rel = getRouterParam(event, 'path') ?? ''
  const root = resolve(useRuntimeConfig(event).uploadDir as string)
  const file = resolve(root, rel)

  // Block path traversal and unknown file types.
  const type = MIME[extname(file).toLowerCase()]
  if (!file.startsWith(root + sep) || !type) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  try {
    const data = await readFile(file)
    setResponseHeaders(event, {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    })
    return data
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
