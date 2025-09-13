<template>
  <div class="input-group">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :class="inputClasses"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
    </div>
    <div v-if="error" class="input-error">
      {{ error }}
    </div>
    <div v-else-if="hint" class="input-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseInput',
  emits: ['update:modelValue', 'blur', 'focus'],
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    }
  },
  computed: {
    inputId() {
      return `input-${Math.random().toString(36).substr(2, 9)}`
    },
    inputClasses() {
      return [
        'input',
        `input--${this.size}`,
        {
          'input--error': this.error,
          'input--disabled': this.disabled
        }
      ]
    }
  }
}
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-required {
  color: var(--error-500);
}

.input-wrapper {
  position: relative;
}

.input {
  width: 100%;
  background-color: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* Sizes */
.input--sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.input--md {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.input--lg {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
}

/* States */
.input--error {
  border-color: var(--border-error);
}

.input--error:focus {
  border-color: var(--border-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input--disabled {
  background-color: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.input-error {
  font-size: 0.875rem;
  color: var(--error-500);
}

.input-hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
</style>
