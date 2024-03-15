<template>
  <div class="provider-task-progress" :title="title" data-e2e-type="provider-task-progress">
    <div class="provider-task-progress-indicator" :style="{ width: value + '%', backgroundColor: progressColor }"></div>
    <div class="provider-task-progress-percentage">
      <span>{{ displayedProgress }}%</span>
    </div>
  </div>
</template>

<script src="./provider-task-progress.js"></script>
<style scoped src="./provider-task-progress.scss" lang="scss"></style>