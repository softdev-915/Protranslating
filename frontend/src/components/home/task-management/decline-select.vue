<template>
  <div
    class="ui fluid search selection dropdown"
    :class="{
      'active visible': showMenu,
      error: isError,
      disabled: isDisabled,
    }"
    tabindex="0"
    @blur="blurSelect"
    @click="openOptions"
  >
    <i class="dropdown icon"></i>
    <div class="text title">{{ title }}</div>
    <div
      class="menu"
      ref="menu"
      @mousedown.prevent
      :class="{ visible: showMenu, hidden: !showMenu }"
      :style="{ display: showMenu ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="item sub-title" @click.prevent>
        {{ subTitle }}
      </div>
      <template v-for="(option, index) in options">
        <div
          class="item"
          :key="index"
          :class="{ selected: option.selected, current: pointer === index }"
          @click.stop="selectItem(option)"
          @mousedown="mousedownItem"
          @mouseenter="pointerSet(index)"
        >
          {{ option.text }}
        </div>
      </template>
    </div>
  </div>
</template>

<script src="./decline-select.js"></script>
<style scoped src="semantic-ui-css/semantic.min.css"></style>
<style scoped src="./decline-select.scss"></style>

