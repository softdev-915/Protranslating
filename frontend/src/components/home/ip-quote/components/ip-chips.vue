<template>
  <div class="chip-container" :class="{'ip-danger': !isValid}">
    <div class="chip" v-for="(chip, i) of chips" :key="chip.label">
      {{ chip }}
      <i class="fas fa-times" @click="deleteChip(i)"></i>
    </div>
    <input
      v-model="currentInput"
      @keypress.enter="saveChip"
      @keydown.delete="backspaceDelete"
      :data-e2e-type="dataE2eType"
      :placeholder="placeholder"
    />
  </div>
</template>

<script src="./ip-chips.js"></script>
<style src="./ip-chips.scss" lang="scss" scoped>
