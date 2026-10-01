<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { apiFetch } = useApi()
const toast = useToast()

const { data: categories, refresh, pending } = await useAsyncData('admin-categories', () =>
  apiFetch<any[]>('/api/categories', { query: { includeInactive: true } }),
  { server: false }
)

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', slug: '', description: '', sortOrder: 0, status: 'active' as 'active' | 'inactive' })

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
watch(() => form.name, (name) => { if (!editingId.value) form.slug = slugify(name) })

function startCreate() {
  editingId.value = null
  Object.assign(form, { name: '', slug: '', description: '', sortOrder: (categories.value?.length ?? 0), status: 'active' })
  showForm.value = true
}
function startEdit(cat: any) {
  editingId.value = cat.id
  Object.assign(form, { name: cat.name, slug: cat.slug, description: cat.description ?? '', sortOrder: cat.sortOrder, status: cat.status })
  showForm.value = true
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    if (editingId.value) {
      await apiFetch(`/api/categories/${editingId.value}`, { method: 'PUT', body: form })
    } else {
      await apiFetch('/api/categories', { method: 'POST', body: form })
    }
    showForm.value = false
    await refresh()
    toast.add({ title: 'Category saved', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save category', color: 'red' })
  } finally {
    saving.value = false
  }
}

async function deactivate(id: string) {
  if (!confirm('Deactivate this category? It will be hidden from the storefront.')) return
  try {
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not deactivate category', color: 'red' })
  }
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Categories</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div class="mb-4 flex justify-end">
        <button class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft" @click="startCreate">
          + New Category
        </button>
      </div>

      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Order</th><th class="p-3">Name</th><th class="p-3">Slug</th><th class="p-3">Status</th><th class="p-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="cat in categories" :key="cat.id">
            <td class="p-3 text-ink-muted">{{ cat.sortOrder }}</td>
            <td class="p-3 text-ink">
              {{ cat.name }}
            </td>
            <td class="p-3 font-mono text-xs text-ink-muted">{{ cat.slug }}</td>
            <td class="p-3">
              <span :class="cat.status === 'active' ? 'text-ok' : 'text-ink-muted'">{{ cat.status }}</span>
            </td>
            <td class="p-3 text-right">
              <button class="font-semibold text-ink underline-offset-4 hover:underline" @click="startEdit(cat)">Edit</button>
              <button v-if="cat.status === 'active'" class="ml-3 text-danger hover:underline" @click="deactivate(cat.id)">Deactivate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Slide-over form -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex justify-end bg-black/60" @click.self="showForm = false">
      <div class="h-full w-full max-w-md space-y-4 overflow-y-auto bg-surface p-6">
        <h2 class="font-display text-lg font-bold text-ink">{{ editingId ? 'Edit' : 'New' }} Category</h2>
        <div>
          <label class="text-xs text-ink-muted">Name</label>
          <input v-model="form.name" class="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Slug</label>
          <input v-model="form.slug" class="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Description</label>
          <textarea v-model="form.description" rows="3" class="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-ink-muted">Sort Order</label>
            <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          </div>
          <div>
            <label class="text-xs text-ink-muted">Status</label>
            <select v-model="form.status" class="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 pt-4">
          <button class="flex-1 rounded-full bg-ink py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button class="rounded border border-line px-4 text-sm text-ink" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
