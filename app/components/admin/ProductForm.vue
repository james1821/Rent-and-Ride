<script setup lang="ts">
const props = defineProps<{ productId?: string }>()
const { apiFetch } = useApi()
const toast = useToast()
const router = useRouter()

const { data: categories } = await useAsyncData('form-categories', () =>
  apiFetch<any[]>('/api/categories', { query: { includeInactive: true } }),
  { server: false }
)
const { data: subcategories } = await useAsyncData(
  'form-subcategories',
  () => apiFetch<any[]>('/api/subcategories', { query: { includeInactive: true } }),
  { server: false }
)

// Number inputs bind as '' when cleared; keep them as string|number here and
// convert to number | undefined on save.
const form = reactive({
  sku: '', name: '', slug: '', brand: '', categoryId: '', subcategoryId: '',
  vehicle: {
    type: 'car' as 'car' | 'motorcycle',
    model: '', year: '' as number | '', transmission: '', fuelType: '',
    seats: '' as number | '', engineDisplacement: '' as number | '', color: '', mileage: '' as number | ''
  },
  description: '', specifications: [] as { label: string; value: string }[],
  images: [''] as string[],
  pricing: { daily: 0, weekly: undefined as number | undefined, monthly: undefined as number | undefined, deposit: 0 },
  quantityTotal: 1, condition: 'excellent', status: 'active', isRentable: true, isFeatured: false
})

if (props.productId) {
  const existing = await apiFetch<any>(`/api/products/${props.productId}`)
  Object.assign(form, {
    ...existing,
    images: existing.images?.length ? existing.images : ['']
  })
  // Legacy documents may not have a vehicle block yet — keep the defaults.
  form.vehicle = { ...form.vehicle, ...(existing.vehicle ?? {}) }
  for (const k of ['year', 'seats', 'engineDisplacement', 'mileage'] as const) {
    if (existing.vehicle?.[k] == null) form.vehicle[k] = ''
  }
  for (const k of ['model', 'transmission', 'fuelType', 'color'] as const) {
    if (existing.vehicle?.[k] == null) form.vehicle[k] = ''
  }
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
watch(() => form.name, (name) => { if (!props.productId) form.slug = slugify(name) })

function addSpec() { form.specifications.push({ label: '', value: '' }) }
function removeSpec(i: number) { form.specifications.splice(i, 1) }
function addImage() { form.images.push('') }
function removeImage(i: number) { form.images.splice(i, 1) }

const num = (v: number | '' | undefined) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v))
const str = (v: string) => (v?.trim() ? v.trim() : undefined)

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const v = form.vehicle
    const payload = {
      sku: form.sku, name: form.name, slug: form.slug, brand: form.brand,
      categoryId: form.categoryId, subcategoryId: form.subcategoryId || undefined,
      description: form.description, specifications: form.specifications.filter((s) => s.label && s.value),
      images: form.images.filter(Boolean), pricing: {
        daily: form.pricing.daily, weekly: num(form.pricing.weekly), monthly: num(form.pricing.monthly), deposit: form.pricing.deposit
      },
      quantityTotal: form.quantityTotal, condition: form.condition, status: form.status,
      isRentable: form.isRentable, isFeatured: form.isFeatured,
      vehicle: {
        type: v.type, model: str(v.model), year: num(v.year), transmission: v.transmission || undefined,
        fuelType: v.fuelType || undefined, seats: num(v.seats), engineDisplacement: num(v.engineDisplacement),
        color: str(v.color), mileage: num(v.mileage)
      }
    }
    if (props.productId) {
      await apiFetch(`/api/products/${props.productId}`, { method: 'PUT', body: payload })
    } else {
      await apiFetch('/api/products', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Vehicle saved', color: 'green' })
    router.push('/admin/products')
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save vehicle', color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-8">
    <section class="space-y-4 rounded-lg border border-line bg-surface p-5">
      <h2 class="text-sm">Basics</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-xs text-ink-muted">Name</label>
          <input v-model="form.name" placeholder="e.g. Honda Click 125" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">SKU / Plate reference</label>
          <input v-model="form.sku" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Slug</label>
          <input v-model="form.slug" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Brand</label>
          <input v-model="form.brand" placeholder="e.g. Honda" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Category</label>
          <select v-model="form.categoryId" class="input mt-1">
            <option value="">Select…</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink-muted">Subcategory</label>
          <select v-model="form.subcategoryId" class="input mt-1">
            <option value="">None</option>
            <option v-for="s in subcategories?.filter(s => s.categoryId === form.categoryId)" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      <div>
        <label class="text-xs text-ink-muted">Description</label>
        <textarea v-model="form.description" rows="3" class="input mt-1" />
      </div>
    </section>

    <section class="space-y-4 rounded-lg border border-line bg-surface p-5">
      <h2 class="text-sm">Vehicle details</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="text-xs text-ink-muted">Vehicle type</label>
          <select v-model="form.vehicle.type" class="input mt-1">
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink-muted">Model</label>
          <input v-model="form.vehicle.model" placeholder="e.g. Click 125" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Year</label>
          <input v-model.number="form.vehicle.year" type="number" min="1950" max="2100" placeholder="2025" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Transmission</label>
          <select v-model="form.vehicle.transmission" class="input mt-1">
            <option value="">—</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="semi-automatic">Semi-automatic</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink-muted">Fuel type</label>
          <select v-model="form.vehicle.fuelType" class="input mt-1">
            <option value="">—</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink-muted">Seats</label>
          <input v-model.number="form.vehicle.seats" type="number" min="1" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Engine (cc)</label>
          <input v-model.number="form.vehicle.engineDisplacement" type="number" min="1" placeholder="125" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Color</label>
          <input v-model="form.vehicle.color" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Mileage (km)</label>
          <input v-model.number="form.vehicle.mileage" type="number" min="0" class="input mt-1">
        </div>
      </div>
    </section>

    <section class="space-y-3 rounded-lg border border-line bg-surface p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-sm">Photos</h2>
        <button type="button" class="text-xs font-semibold text-ink hover:underline" @click="addImage">+ Add photo</button>
      </div>
      <div v-for="(img, i) in form.images" :key="i" class="flex items-start gap-2">
        <div class="flex-1"><AdminImageUpload v-model="form.images[i]" folder="products" /></div>
        <button type="button" class="pt-2 text-danger" aria-label="Remove photo" @click="removeImage(i)"><UIcon name="i-heroicons-x-mark" class="h-5 w-5" /></button>
      </div>
    </section>

    <section class="space-y-3 rounded-lg border border-line bg-surface p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-sm">Extra specifications</h2>
        <button type="button" class="text-xs font-semibold text-ink hover:underline" @click="addSpec">+ Add spec</button>
      </div>
      <p v-if="!form.specifications.length" class="text-xs text-ink-muted">Optional — e.g. Features: Bluetooth, ABS · Luggage: 2 helmets.</p>
      <div v-for="(spec, i) in form.specifications" :key="i" class="flex gap-2">
        <input v-model="spec.label" placeholder="Label (e.g. Features)" class="input flex-1">
        <input v-model="spec.value" placeholder="Value (e.g. Bluetooth, ABS)" class="input flex-1">
        <button type="button" class="text-danger" aria-label="Remove spec" @click="removeSpec(i)"><UIcon name="i-heroicons-x-mark" class="h-5 w-5" /></button>
      </div>
    </section>

    <section class="space-y-4 rounded-lg border border-line bg-surface p-5">
      <h2 class="text-sm">Rates &amp; availability</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label class="text-xs text-ink-muted">Daily (₱)</label>
          <input v-model.number="form.pricing.daily" type="number" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Weekly (₱)</label>
          <input v-model.number="form.pricing.weekly" type="number" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Monthly (₱)</label>
          <input v-model.number="form.pricing.monthly" type="number" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Deposit (₱)</label>
          <input v-model.number="form.pricing.deposit" type="number" class="input mt-1">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label class="text-xs text-ink-muted">Units owned</label>
          <input v-model.number="form.quantityTotal" type="number" min="0" class="input mt-1">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Condition</label>
          <select v-model="form.condition" class="input mt-1">
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink-muted">Status</label>
          <select v-model="form.status" class="input mt-1">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div class="flex flex-col justify-end gap-2 pb-2">
          <label class="flex items-center gap-2 text-sm text-ink"><input v-model="form.isRentable" type="checkbox"> Available to rent</label>
          <label class="flex items-center gap-2 text-sm text-ink"><input v-model="form.isFeatured" type="checkbox"> Featured</label>
        </div>
      </div>
    </section>

    <div class="flex gap-3">
      <button class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save Vehicle' }}
      </button>
      <NuxtLink to="/admin/products" class="btn-outline">Cancel</NuxtLink>
    </div>
  </div>
</template>
