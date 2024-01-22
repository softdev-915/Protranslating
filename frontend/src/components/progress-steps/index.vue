<template>
  <div class="progress-steps">
    <div
      class="step"
      :class="[{ completed: current >= index }, { active: current === index }, stepClass]"
      :data-e2e-type="`ip-progress-step-${index + 1}`"
      v-for="(step, index) in steps"
      :key="index"
    >
      <div class="step__bullet">
        <span v-if="index >= current">{{ index + 1 }}</span>
        <i v-else class="fas fa-check"></i>
      </div>
      <p class="step__text">{{ step }}</p>
    </div>
  </div>
</template>

<script src="./index.js"></script>
<style scoped lang="scss" src="./index.scss"></style>
