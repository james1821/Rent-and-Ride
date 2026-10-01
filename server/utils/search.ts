// Firestore-friendly prefix search: each product/category stores a
// precomputed searchPrefixes array so autocomplete works via a single
// array-contains query. Matches by word prefix only, not fuzzy substring.

const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'of'])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

function prefixesOf(word: string): string[] {
  const prefixes: string[] = []
  for (let i = 2; i <= word.length; i++) prefixes.push(word.slice(0, i))
  return prefixes
}

// Builds the searchPrefixes array for a product document.
export function buildProductSearchIndex(fields: {
  name: string
  brand: string
  sku: string
  model?: string
  vehicleType?: string
  categoryName?: string
  subcategoryName?: string
}): string[] {
  const words = [
    ...tokenize(fields.name),
    ...tokenize(fields.brand),
    ...tokenize(fields.sku),
    ...(fields.model ? tokenize(fields.model) : []),
    ...(fields.vehicleType ? tokenize(fields.vehicleType === 'car' ? 'car cars' : 'motorcycle motorcycles motorbike bike') : []),
    ...(fields.categoryName ? tokenize(fields.categoryName) : []),
    ...(fields.subcategoryName ? tokenize(fields.subcategoryName) : [])
  ]
  const prefixSet = new Set<string>()
  for (const w of words) for (const p of prefixesOf(w)) prefixSet.add(p)
  return Array.from(prefixSet)
}

export function buildCategorySearchIndex(name: string): string[] {
  const prefixSet = new Set<string>()
  for (const w of tokenize(name)) for (const p of prefixesOf(w)) prefixSet.add(p)
  return Array.from(prefixSet)
}

// Confirms every word in a multi-word query is present, since Firestore
// can only array-contains on one word per request.
export function matchesAllWords(searchPrefixes: string[], query: string): boolean {
  const queryWords = tokenize(query)
  if (queryWords.length === 0) return true
  const prefixSet = new Set(searchPrefixes)
  return queryWords.every((w) => prefixSet.has(w) || Array.from(prefixSet).some((p) => p.startsWith(w)))
}
