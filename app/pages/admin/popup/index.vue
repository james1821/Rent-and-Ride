<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { apiFetch } = useApi()
const toast = useToast()

const form = reactive({
  enabled: false,
  title: '',
  description: '',
  secondaryText: '',
  imageUrl: '',
  ctaLabel: '',
  ctaHref: '',
  frequency: 'once' as 'once' | 'session' | 'daily' | 'weekly',
  firstVisitOnly: true,
  delaySeconds: 2,
  startLocal: '',
  endLocal: '',
  resetDismissals: true
})

// <input type="datetime-local"> ⇄ ISO string
const pad = (n: number) => String(n).padStart(2, '0')
function toLocal(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : '')

const { data, pending, error } = await useAsyncData('admin-popup', () => apiFetch<any>('/api/admin/popup'), { server: false })
watch(data, (d) => {
  if (!d) return
  Object.assign(form, {
    enabled: !!d.enabled, title: d.title ?? '', description: d.description ?? '', secondaryText: d.secondaryText ?? '',
    imageUrl: d.imageUrl ?? '', ctaLabel: d.ctaLabel ?? '', ctaHref: d.ctaHref ?? '',
    frequency: d.frequency ?? 'once', firstVisitOnly: d.firstVisitOnly ?? true, delaySeconds: d.delaySeconds ?? 2,
    startLocal: toLocal(d.startDate), endLocal: toLocal(d.endDate), resetDismissals: true
  })
}, { immediate: true })

const status = computed(() => {
  if (!form.enabled) return { label: 'Disabled', tone: 'text-ink-muted', dot: 'bg-ink-faint' }
  const now = Date.now()
  if (form.startLocal && now < new Date(form.startLocal).getTime()) return { label: 'Scheduled — not live yet', tone: 'text-warn', dot: 'bg-warn' }
  if (form.endLocal && now > new Date(form.endLocal).getTime()) return { label: 'Expired', tone: 'text-danger', dot: 'bg-danger' }
  return { label: 'Live', tone: 'text-ok', dot: 'bg-ok' }
})

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const saved = await apiFetch<any>('/api/admin/popup', {
      method: 'PUT',
      body: {
        enabled: form.enabled, title: form.title, description: form.description, secondaryText: form.secondaryText,
        imageUrl: form.imageUrl.trim(), ctaLabel: form.ctaLabel, ctaHref: form.ctaHref.trim(),
        frequency: form.frequency, firstVisitOnly: form.firstVisitOnly, delaySeconds: Number(form.delaySeconds) || 0,
        startDate: toIso(form.startLocal), endDate: toIso(form.endLocal), resetDismissals: form.resetDismissals
      }
    })
    data.value = saved
    toast.add({ title: 'Popup saved', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save popup', color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-extrabold text-ink">Promotional Popup</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div v-if="pending" class="text-ink-muted">Loading…</div>
      <div v-else-if="error" class="rounded border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        Could not load popup settings: {{ error.message }}
      </div>

      <div v-else class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <!-- Editor -->
        <div class="space-y-6">
          <section class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-5">
            <div>
              <p class="flex items-center gap-2 text-sm font-semibold text-ink">
                <span class="h-2 w-2 rounded-full" :class="status.dot" /> <span :class="status.tone">{{ status.label }}</span>
              </p>
              <p class="mt-1 text-xs text-ink-muted">Shown to storefront visitors while enabled and inside its schedule.</p>
            </div>
            <label class="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
              <input v-model="form.enabled" type="checkbox" class="h-5 w-5 accent-black"> Enabled
            </label>
          </section>

          <section class="space-y-4 rounded-lg border border-line bg-surface p-5">
            <h2 class="text-sm">Content</h2>
            <div>
              <label class="text-xs text-ink-muted">Banner image</label>
              <div class="mt-1"><AdminImageUpload v-model="form.imageUrl" folder="popup" large placeholder="Paste an image URL or upload (JPG, PNG, WebP · max 5 MB)" /></div>
              <p class="mt-1 text-xs text-ink-muted">Optional. Without an image the popup uses a bold black text layout.</p>
            </div>
            <div>
              <label class="text-xs text-ink-muted">Small text above the title (optional)</label>
              <input v-model="form.secondaryText" maxlength="200" placeholder="e.g. New this month" class="input mt-1">
            </div>
            <div>
              <label class="text-xs text-ink-muted">Title</label>
              <input v-model="form.title" maxlength="120" placeholder="e.g. Rent the ride you need" class="input mt-1">
            </div>
            <div>
              <label class="text-xs text-ink-muted">Description</label>
              <textarea v-model="form.description" rows="3" maxlength="600" class="input mt-1" />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-xs text-ink-muted">Button text (optional)</label>
                <input v-model="form.ctaLabel" maxlength="40" placeholder="Browse Vehicles" class="input mt-1">
              </div>
              <div>
                <label class="text-xs text-ink-muted">Button link</label>
                <input v-model="form.ctaHref" placeholder="/catalog or https://…" class="input mt-1">
              </div>
            </div>
          </section>

          <section class="space-y-4 rounded-lg border border-line bg-surface p-5">
            <h2 class="text-sm">Behavior</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-xs text-ink-muted">Display frequency</label>
                <select v-model="form.frequency" class="input mt-1">
                  <option value="once">Once (until you change the popup)</option>
                  <option value="session">Once per browsing session</option>
                  <option value="daily">At most once a day</option>
                  <option value="weekly">At most once a week</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-ink-muted">Delay before showing (seconds)</label>
                <input v-model.number="form.delaySeconds" type="number" min="0" max="120" class="input mt-1">
              </div>
              <div>
                <label class="text-xs text-ink-muted">Start (optional)</label>
                <input v-model="form.startLocal" type="datetime-local" class="input mt-1">
              </div>
              <div>
                <label class="text-xs text-ink-muted">End (optional)</label>
                <input v-model="form.endLocal" type="datetime-local" class="input mt-1">
              </div>
            </div>
            <label class="flex items-start gap-3 text-sm text-ink">
              <input v-model="form.firstVisitOnly" type="checkbox" class="mt-0.5 h-4 w-4 accent-black">
              <span>First-time visitors only<span class="block text-xs text-ink-muted">Returning visitors (anyone who has opened the site before in this browser) won't see it. Turn off to also show it to returning visitors, using the frequency above.</span></span>
            </label>
            <label class="flex items-start gap-3 text-sm text-ink">
              <input v-model="form.resetDismissals" type="checkbox" class="mt-0.5 h-4 w-4 accent-black">
              <span>Show again to visitors who already closed it<span class="block text-xs text-ink-muted">Recommended when the content changes. Untick for small fixes such as a typo.</span></span>
            </label>
          </section>

          <div class="flex gap-3">
            <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save Popup' }}</button>
          </div>
        </div>

        <!-- Live preview -->
        <div class="xl:sticky xl:top-6 xl:self-start">
          <p class="eyebrow mb-3">Live preview</p>
          <div class="rounded-2xl bg-black/80 p-4 sm:p-6">
            <PromoPopupCard
              stacked
              :title="form.title || 'Your title here'"
              :description="form.description"
              :secondary-text="form.secondaryText"
              :image-url="form.imageUrl"
              :cta-label="form.ctaLabel"
              :cta-href="form.ctaHref"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
