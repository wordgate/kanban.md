<script setup lang="ts">
import Sidebar from '../sidebar/Sidebar.vue'
import ContentArea from './ContentArea.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <ContentArea />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
