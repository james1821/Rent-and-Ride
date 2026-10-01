<script setup lang="ts">
// Image field: paste a URL or upload a file (POST /api/admin/upload-image).
// Reused by the vehicle form and the promotional popup editor.
const props = defineProps<{ modelValue: string; folder?: 'popup' | 'products' | 'categories' | 'banners'; large?: boolean; placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const { apiFetch } = useApi()
const toast = useToast()
const uploading = ref(false)
const broken = ref(false)
watch(() => props.modelValue, () => { broken.value = false })

const MAX_BYTES = 5 * 1024 * 1024

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-selecting the same file
  if (!file) return
  if (!file.type.startsWith('image/')) { toast.add({ title: 'Please choose an image file', color: 'red' }); return }
  if (file.size > MAX_BYTES) { toast.add({ title: 'Image must be 5 MB or smaller', color: 'red' }); return }

  uploading.value = true
  try {
    const body = new FormData()
    body.append('folder', props.folder ?? 'popup')
    body.append('file', file)
    const res = await apiFetch<{ url: string }>('/api/admin/upload-image', { method: 'POST', body })
    emit('update:modelValue', res.url)
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Upload failed', color: 'red' })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="flex items-start gap-3">
    <div
      class="flex shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-sunken"
      :class="large ? 'h-28 w-44' : 'h-11 w-16'"
    >
      <img v-if="modelValue && !broken" :src="modelValue" alt="" class="h-full w-full object-cover" @error="broken = true">
      <UIcon v-else name="i-heroicons-photo" class="h-5 w-5 text-ink-faint" />
    </div>
    <div class="min-w-0 flex-1 space-y-2">
      <input
        :value="modelValue" :placeholder="placeholder ?? 'https://… or upload'" class="input"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <div class="flex items-center gap-3 text-xs">
        <label class="cursor-pointer rounded-full border border-ink px-3 py-1 font-semibold text-ink transition hover:bg-ink hover:text-white" :class="uploading && 'pointer-events-none opacity-50'">
          {{ uploading ? 'Uploading…' : 'Upload image' }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="sr-only" :disabled="uploading" @change="onPick">
        </label>
        <button v-if="modelValue" type="button" class="text-danger hover:underline" @click="emit('update:modelValue', '')">Remove</button>
        <span v-if="broken" class="text-warn">Image could not be loaded</span>
      </div>
    </div>
  </div>
</template>
