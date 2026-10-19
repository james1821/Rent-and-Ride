import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

// LEGACY: serves images uploaded before the switch to Cloudinary (see
// upload-image.post.ts, which now stores files in Cloudinary).
//
// In production these images are shipped as *static public assets* by the
// `nitro.publicAssets` entry in nuxt.config.ts (copied to
// .output/public/uploads/**), so the platform CDN serves them before this
// handler is ever reached. This route is a local-dev fallback that reads the
// same ./uploads directory from disk.
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
