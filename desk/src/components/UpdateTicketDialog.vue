<template>
  <div class="dialog-overlay" @click.self="onCancel">
    <div class="dialog-box">
      <h2 class="dialog-title">Update Ticket</h2>
      <p class="dialog-message">Are you sure you want to update this ticket?</p>
      <div class="dialog-actions">
        <button class="btn btn-primary" @click="onConfirm">Update</button>
        <button class="btn btn-secondary" @click="onCancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
const emit = defineEmits(['confirm', 'cancel']);

function onConfirm() {
  emit('confirm');
}
function onCancel() {
  emit('cancel');
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog-box {
  background: #fff;
  border-radius: 8px;
  padding: 2rem 1.5rem;
  min-width: 320px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  text-align: center;
}
.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.dialog-message {
  margin-bottom: 1.5rem;
}
.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}
.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
