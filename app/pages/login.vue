<script setup lang="ts">
const { login } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  submitting.value = true
  errorMsg.value = ''
  try {
    await login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    errorMsg.value = 'Invalid email or password.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-page flex min-h-[70vh] items-center justify-center py-16">
    <div class="w-full max-w-sm">
      <h1 class="text-4xl text-ink">Sign In</h1>
      <p class="mt-1 text-sm text-ink-muted">Welcome back to {{ $config.public.siteName }}.</p>

      <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email</label>
          <input v-model="email" type="email" required class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        </div>
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Password</label>
          <input v-model="password" type="password" required class="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        </div>

        <p v-if="errorMsg" class="text-sm text-danger">{{ errorMsg }}</p>

        <button type="submit" class="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-ink-muted">
        Don't have an account? <NuxtLink to="/register" class="font-semibold text-ink underline-offset-4 hover:underline">Create one</NuxtLink>
      </p>
    </div>
  </div>
</template>
