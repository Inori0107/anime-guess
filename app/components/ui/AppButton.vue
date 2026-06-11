<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const props = withDefaults(defineProps<{
  variant?: Variant
  disabled?: boolean
  type?: 'button' | 'submit'
  ariaLabel?: string
  fullWidth?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  fullWidth: false,
})

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
  ghost: 'bg-transparent hover:bg-white/10 text-slate-200 border border-white/20',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variantClasses[variant], fullWidth ? 'w-full' : '']"
  >
    <slot />
  </button>
</template>
