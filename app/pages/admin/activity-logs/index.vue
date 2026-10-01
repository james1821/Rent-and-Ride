<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { apiFetch } = useApi()
const { data: logs, pending } = await useAsyncData('admin-activity-logs', () => apiFetch<any[]>('/api/admin/activity-logs'), { server: false })
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Activity Logs</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div v-if="pending" class="text-ink-muted">Loading…</div>
      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Action</th><th class="p-3">Target</th><th class="p-3">Actor</th><th class="p-3">When</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="log in logs" :key="log.id">
            <td class="p-3 text-ink">{{ log.action }}</td>
            <td class="p-3 font-mono text-xs text-ink-muted">{{ log.targetType }}/{{ log.targetId }}</td>
            <td class="p-3 text-ink-muted">{{ log.actorId }}</td>
            <td class="p-3 text-ink-muted">{{ new Date(log.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
