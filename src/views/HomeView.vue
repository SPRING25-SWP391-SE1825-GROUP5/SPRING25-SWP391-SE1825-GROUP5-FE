<template>
  <div class="home">
    <div class="hero">
      <h1>Welcome to Vue Frontend</h1>
      <p>A Vue.js application with TypeScript and ASP.NET API integration</p>
      
      <div class="actions" v-if="!authStore.isAuthenticated">
        <router-link to="/login" class="btn btn-primary">
          Get Started
        </router-link>
      </div>
      
      <div class="actions" v-else>
        <router-link to="/dashboard" class="btn btn-primary">
          Go to Dashboard
        </router-link>
      </div>
    </div>

    <div class="features">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>🚀 Vue 3 + TypeScript</h3>
          <p>Built with the latest Vue 3 Composition API and TypeScript for type safety</p>
        </div>
        
        <div class="feature-card">
          <h3>⚡ Vite Build Tool</h3>
          <p>Lightning fast development with Vite's hot module replacement</p>
        </div>
        
        <div class="feature-card">
          <h3>🔗 ASP.NET Integration</h3>
          <p>Seamless integration with ASP.NET Core Web API backend</p>
        </div>
        
        <div class="feature-card">
          <h3>🔐 Authentication</h3>
          <p>JWT-based authentication with role-based access control</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.hero p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.actions {
  margin-top: 2rem;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.features {
  margin-top: 4rem;
}

.features h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  padding: 2rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}
</style>
