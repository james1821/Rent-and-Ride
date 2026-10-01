<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { apiFetch } = useApi()
const toast = useToast()

const form = reactive({ companyName: '', contactEmail: '', contactPhone: '', address: '', facebook: '', instagram: '' })

const { data } = await useAsyncData('admin-settings-general', () =>
  apiFetch<any>('/api/settings/general').catch(() => null),
  { server: false }
)
watch(data, (d) => { if (d) Object.assign(form, { ...d, ...d.socials }) }, { immediate: true })

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await apiFetch('/api/settings/general', {
      method: 'PUT',
      body: {
        companyName: form.companyName, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
        address: form.address, socials: { facebook: form.facebook, instagram: form.instagram }
      }
    })
    toast.add({ title: 'Settings saved', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save settings', color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Settings</h1></template>
    </AdminTopbar>

    <div class="max-w-lg space-y-4 p-6">
      <div>
        <label class="text-xs text-ink-muted">Company Name</label>
        <input v-model="form.companyName" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      </div>
      <div>
        <label class="text-xs text-ink-muted">Contact Email</label>
        <input v-model="form.contactEmail" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      </div>
      <div>
        <label class="text-xs text-ink-muted">Contact Phone</label>
        <input v-model="form.contactPhone" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      </div>
      <div>
        <label class="text-xs text-ink-muted">Address</label>
        <input v-model="form.address" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-ink-muted">Facebook URL</label>
          <input v-model="form.facebook" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        </div>
        <div>
          <label class="text-xs text-ink-muted">Instagram URL</label>
          <input v-model="form.instagram" class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        </div>
      </div>
      <button class="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save Settings' }}
      </button>
    </div>
  </div>
</template>
