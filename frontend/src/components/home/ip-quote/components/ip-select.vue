<template>
  <div
    class="ip-select"
    :class="{'ip-select-rectangle': isRectangleStyle}"
    :tabindex="tabindex"
    :data-e2e-value="selectedShown"
    @blur="close"
  >
    <div class="selected" @click="toggle" :class="{'ip-danger': !isValid, 'disabled': isDisabled}">
      <span data-e2e-type="selected-value">{{ selectedShown }}</span>
      <i class="fas fa-chevron-down" />
    </div>
    <transition name="fade">
      <div v-show="opened" class="items">
        <div v-for="(option, i) of options" :key="i" @click="select(option)" :value="option[itemKey]">
          {{ option[itemKey] }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script src="./ip-select.js"></script>
<style src="./ip-select.scss" lang="scss" scoped></style>
