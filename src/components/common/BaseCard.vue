<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>
    <div class="card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseCard',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'bordered', 'elevated'].includes(value)
    },
    padding: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'none'].includes(value)
    }
  },
  computed: {
    cardClasses() {
      return [
        'card',
        `card--${this.variant}`,
        `card--padding-${this.padding}`
      ]
    }
  }
}
</script>

<style scoped>
.card {
  background-color: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
}

.card--default {
  border: 1px solid var(--border-primary);
}

.card--bordered {
  border: 2px solid var(--border-secondary);
}

.card--elevated {
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}

.card__header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
}

.card__body {
  flex: 1;
}

.card--padding-none .card__body {
  padding: 0;
}

.card--padding-sm .card__body {
  padding: 0.75rem;
}

.card--padding-md .card__body {
  padding: 1.5rem;
}

.card--padding-lg .card__body {
  padding: 2rem;
}

.card__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
}
</style>
