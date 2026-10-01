<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { apiFetch } = useApi()
const toast = useToast()

const { data: banners, refresh, pending } = await useAsyncData('admin-banners', () =>
  apiFetch<any[]>('/api/banners', { query: { includeInactive: true } }),
  { server: false }
)

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '', description: '', imageUrl: '', ctaLabel: '', ctaHref: '',
  secondaryCtaLabel: '', secondaryCtaHref: '', sortOrder: 0, placement: 'hero' as 'hero' | 'promo', status: 'active' as 'active' | 'inactive'
})

function startCreate() {
  editingId.value = null
  Object.assign(form, { title: '', description: '', imageUrl: '', ctaLabel: '', ctaHref: '', secondaryCtaLabel: '', secondaryCtaHref: '', sortOrder: banners.value?.length ?? 0, placement: 'hero', status: 'active' })
  showForm.value = true
}
function startEdit(b: any) {
  editingId.value = b.id
  Object.assign(form, b)
  showForm.value = true
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    if (editingId.value) await apiFetch(`/api/banners/${editingId.value}`, { method: 'PUT', body: form })
    else await apiFetch('/api/banners', { method: 'POST', body: form })
    showForm.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save banner', color: 'red' })
  } finally {
    saving.value = false
  }
}
async function remove(id: string) {
  if (!confirm('Delete this banner?')) return
  await apiFetch(`/api/banners/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Banners</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div class="mb-4 flex justify-end">
        <button class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft" @click="startCreate">+ New Banner</button>
      </div>

      <div v-if="pending" class="text-ink-muted">Loading…</div>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="b in banners" :key="b.id" class="overflow-hidden rounded border border-line bg-surface">
          <img v-if="b.imageUrl" :src="b.imageUrl" class="h-32 w-full object-cover" :alt="b.title">
          <div class="p-4">
            <p class="text-xs uppercase text-ink-muted">{{ b.placement }} · {{ b.status }}</p>
            <p class="mt-1 font-display font-semibold text-ink">{{ b.title }}</p>
            <div class="mt-3 flex gap-3 text-sm">
              <button class="font-semibold text-ink underline-offset-4 hover:underline" @click="startEdit(b)">Edit</button>
              <button class="text-danger hover:underline" @click="remove(b.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex justify-end bg-black/60" @click.self="showForm = false">
      <div class="h-full w-full max-w-md space-y-3 overflow-y-auto bg-surface p-6">
        <h2 class="font-display text-lg font-bold text-ink">{{ editingId ? 'Edit' : 'New' }} Banner</h2>
        <input v-model="form.title" placeholder="Title" class="w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        <textarea v-model="form.description" placeholder="Description" rows="2" class="w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink" />
        <AdminImageUpload v-model="form.imageUrl" folder="banners" placeholder="Image URL or upload" />
        <div class="grid grid-cols-2 gap-2">
          <input v-model="form.ctaLabel" placeholder="CTA label" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <input v-model="form.ctaHref" placeholder="CTA link" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="form.secondaryCtaLabel" placeholder="2nd CTA label (optional)" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <input v-model="form.secondaryCtaHref" placeholder="2nd CTA link" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="grid grid-cols-3 gap-2">
          <select v-model="form.placement" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
            <option value="hero">Hero</option>
            <option value="promo">Promo</option>
          </select>
          <select v-model="form.status" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input v-model.number="form.sortOrder" type="number" placeholder="Order" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="flex gap-3 pt-2">
          <button class="flex-1 rounded-full bg-ink py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="saving" @click="save">Save</button>
          <button class="rounded border border-line px-4 text-sm text-ink" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
