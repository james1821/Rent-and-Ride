<script setup lang="ts">
const { register } = useAuth()
const router = useRouter()

const form = reactive({ firstName: '', lastName: '', email: '', phone: '', password: '' })
const submitting = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  submitting.value = true
  errorMsg.value = ''
  try {
    await register(form)
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.message?.includes('email-already-in-use')
      ? 'An account with this email already exists.'
      : 'Could not create your account. Please check your details and try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-page flex min-h-[70vh] items-center justify-center py-16">
    <div class="w-full max-w-sm">
      <h1 class="text-4xl text-ink">Create Account</h1>
      <p class="mt-1 text-sm text-ink-muted">Join {{ $config.public.siteName }} to start renting cars and motorcycles.</p>

      <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
        <div class="grid grid-cols-2 gap-3">
          <input v-model="form.firstName" placeholder="First name" required class="rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
          <input v-model="form.lastName" placeholder="Last name" required class="rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        </div>
        <input v-model="form.email" type="email" placeholder="Email" required class="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        <input v-model="form.phone" placeholder="Phone number" required class="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        <input v-model="form.password" type="password" placeholder="Password (min. 8 characters)" required minlength="8" class="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink">

        <p v-if="errorMsg" class="text-sm text-danger">{{ errorMsg }}</p>

        <button type="submit" class="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50" :disabled="submitting">
          {{ submitting ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-ink-muted">
        Already have an account? <NuxtLink to="/login" class="font-semibold text-ink underline-offset-4 hover:underline">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
