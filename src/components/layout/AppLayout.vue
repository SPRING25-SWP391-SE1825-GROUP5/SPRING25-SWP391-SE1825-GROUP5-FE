<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter v-if="!$route.meta?.hideFooter" />
  </div>
</template>

<script>
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

export default {
  name: 'AppLayout',
  components: {
    AppHeader,
    AppFooter
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 120px; /* Space for fixed header */
  min-height: calc(100vh - 120px);
}
</style>
