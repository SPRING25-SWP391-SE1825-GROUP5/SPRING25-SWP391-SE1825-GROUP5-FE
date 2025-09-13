<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn__spinner">⟳</span>
    <slot />
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  emits: ['click'],
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'outline', 'success', 'warning', 'error'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buttonClasses() {
      return [
        'btn',
        `btn--${this.variant}`,
        `btn--${this.size}`,
        {
          'btn--disabled': this.disabled,
          'btn--loading': this.loading,
          'btn--full-width': this.fullWidth
        }
      ]
    }
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Sizes */
.btn--sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn--md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn--lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Variants */
.btn--primary {
  background-color: var(--primary-500);
  color: var(--text-inverse);
  border-color: var(--primary-500);
}

.btn--primary:hover:not(.btn--disabled) {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
}

.btn--secondary {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.btn--secondary:hover:not(.btn--disabled) {
  background-color: var(--bg-secondary);
}


/* Outline variant (used across Booking flow) */
.btn--outline {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.btn--outline:hover:not(.btn--disabled) {
  background-color: var(--primary-50);
  border-color: var(--primary-300);
  color: var(--text-primary);
}

.btn--success {
  background-color: var(--success-500);
  color: var(--text-inverse);
  border-color: var(--success-500);
}

.btn--success:hover:not(.btn--disabled) {
  background-color: var(--success-600);
  border-color: var(--success-600);
}

.btn--warning {
  background-color: var(--warning-500);
  color: var(--text-inverse);
  border-color: var(--warning-500);
}

.btn--warning:hover:not(.btn--disabled) {
  background-color: var(--warning-600);
  border-color: var(--warning-600);
}

.btn--error {
  background-color: var(--error-500);
  color: var(--text-inverse);
  border-color: var(--error-500);
}

.btn--error:hover:not(.btn--disabled) {
  background-color: var(--error-600);
  border-color: var(--error-600);
}

/* States */
.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading {
  cursor: wait;
}

.btn--full-width {
  width: 100%;
}

.btn__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
