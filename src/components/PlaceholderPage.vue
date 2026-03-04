<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="wrap">
    <div class="header">
      <div class="title">{{ title }}</div>
    </div>
    <div class="body">预留界面，暂无内容。</div>
  </div>
</template>

<style scoped>
.wrap {
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  overflow: hidden;
}
.header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
}
.title {
  font-weight: 600;
}
.body {
  padding: 16px;
  color: #666;
}
</style>

