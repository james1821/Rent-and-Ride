<script setup lang="ts">
const props = defineProps<{ productId: string }>()
const { apiFetch } = useApi()
const toast = useToast()

const { data: units, refresh, pending } = await useAsyncData(
  `inventory-${props.productId}`,
  () => apiFetch<any[]>(`/api/products/${props.productId}/inventory`),
  { server: false }
)

const newSerial = ref('')
const newCondition = ref('excellent')
const adding = ref(false)

async function addUnit() {
  if (!newSerial.value.trim()) return
  adding.value = true
  try {
    await apiFetch(`/api/products/${props.productId}/inventory`, {
      method: 'POST',
      body: { serialNumber: newSerial.value.trim(), condition: newCondition.value }
    })
    newSerial.value = ''
    await refresh()
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not add unit', color: 'red' })
  } finally {
    adding.value = false
  }
}

async function updateUnit(unitId: string, patch: Record<string, unknown>) {
  try {
    await apiFetch(`/api/products/${props.productId}/inventory/${unitId}`, { method: 'PUT', body: patch })
    await refresh()
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not update unit', color: 'red' })
  }
}
</script>

<template>
  <div>
    <h2 class="font-display text-base font-semibold text-ink">Individual Units (Plate / Chassis Tracking)</h2>
    <p class="mt-1 text-xs text-ink-muted">
      Optional per-vehicle tracking (plate number or chassis/VIN) for condition and maintenance history — availability calculations use total quantity, not individual unit assignment yet.
    </p>

    <div v-if="pending" class="mt-4 text-sm text-ink-muted">Loading…</div>

    <table v-else class="mt-4 w-full overflow-hidden rounded border border-line bg-surface text-sm">
      <thead>
        <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
          <th class="p-3">Plate / VIN</th><th class="p-3">Condition</th><th class="p-3">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="unit in units" :key="unit.id">
          <td class="p-3 font-mono text-ink">{{ unit.serialNumber }}</td>
          <td class="p-3">
            <select :value="unit.condition" class="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink" @change="(e: any) => updateUnit(unit.id, { condition: e.target.value })">
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs-repair">Needs Repair</option>
            </select>
          </td>
          <td class="p-3">
            <select :value="unit.status" class="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink" @change="(e: any) => updateUnit(unit.id, { status: e.target.value })">
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </td>
        </tr>
        <tr v-if="!units?.length">
          <td colspan="3" class="p-3 text-ink-muted">No individual vehicles registered yet.</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex gap-2">
      <input v-model="newSerial" placeholder="Plate or chassis no., e.g. ABC 1234" class="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      <select v-model="newCondition" class="rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        <option value="excellent">Excellent</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
      </select>
      <button class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="adding" @click="addUnit">
        Add Unit
      </button>
    </div>
  </div>
</template>
