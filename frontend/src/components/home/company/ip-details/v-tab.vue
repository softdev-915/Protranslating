<template>
  <div class="v-tabs">
    <ul>
      <li
        v-for="(tab, index) in tabs"
        :class="{ 'active': index === activeIndex }"
        :key="`tab-index-${index}`"
        @click="selectTab(index)"
        :data-e2e-type="`ip-details-tab-${tab.value}`"
      >
        <a>{{ tab.name }}</a>
      </li>
      <li class="last"></li>
    </ul>
    <div class="controls">
      <slot></slot>
    </div>
  </div>
</template>

<script src="./v-tab.js"></script>
<style lang="scss" src="./v-tab.scss" scoped>
</style>