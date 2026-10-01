<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { apiFetch } = useApi()
const toast = useToast()

const { data: coupons, refresh, pending } = await useAsyncData('admin-coupons', () => apiFetch<any[]>('/api/coupons'), { server: false })

const showForm = ref(false)
const form = reactive({ code: '', type: 'percent' as 'percent' | 'fixed', value: 10, minSubtotal: undefined as number | undefined, maxUses: undefined as number | undefined, validFrom: '', validTo: '', status: 'active' as 'active' | 'inactive' })

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await apiFetch('/api/coupons', { method: 'POST', body: form })
    showForm.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not create coupon', color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Coupons</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div class="mb-4 flex justify-end">
        <button class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft" @click="showForm = true">+ New Coupon</button>
      </div>

      <div v-if="pending" class="text-ink-muted">Loading…</div>
      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Code</th><th class="p-3">Type</th><th class="p-3">Value</th><th class="p-3">Uses</th><th class="p-3">Valid</th><th class="p-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="c in coupons" :key="c.id">
            <td class="p-3 font-mono text-ink">{{ c.code }}</td>
            <td class="p-3 text-ink-muted">{{ c.type }}</td>
            <td class="p-3 text-ink">{{ c.type === 'percent' ? `${c.value}%` : `₱${c.value}` }}</td>
            <td class="p-3 text-ink-muted">{{ c.usedCount }}{{ c.maxUses ? ` / ${c.maxUses}` : '' }}</td>
            <td class="p-3 text-ink-muted">{{ c.validFrom }} → {{ c.validTo }}</td>
            <td class="p-3"><span :class="c.status === 'active' ? 'text-ok' : 'text-ink-muted'">{{ c.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex justify-end bg-black/60" @click.self="showForm = false">
      <div class="h-full w-full max-w-md space-y-3 overflow-y-auto bg-surface p-6">
        <h2 class="font-display text-lg font-bold text-ink">New Coupon</h2>
        <input v-model="form.code" placeholder="CODE" class="w-full rounded border border-line bg-canvas px-3 py-2 text-sm uppercase text-ink">
        <div class="grid grid-cols-2 gap-2">
          <select v-model="form.type" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed (₱)</option>
          </select>
          <input v-model.number="form.value" type="number" placeholder="Value" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input v-model.number="form.minSubtotal" type="number" placeholder="Min subtotal (optional)" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <input v-model.number="form.maxUses" type="number" placeholder="Max uses (optional)" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="form.validFrom" type="date" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <input v-model="form.validTo" type="date" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
        </div>
        <div class="flex gap-3 pt-2">
          <button class="flex-1 rounded-full bg-ink py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="saving" @click="save">Save</button>
          <button class="rounded border border-line px-4 text-sm text-ink" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
