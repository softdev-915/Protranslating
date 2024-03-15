<template>
  <div class="ui fluid search selection dropdown"
       :class="{ 'active visible':showMenu, 'error': isError, 'disabled': isDisabled }"
       @click="openOptions"
       @focus="openOptions">
    <i class="dropdown" :class="dynamicClass"></i>
    <input class="search"
           autocomplete="off"
           tabindex="0"
           v-model="searchText"
           ref="input"
           @focus.prevent="openOptions"
           @keyup.esc="closeOptions"
           @blur="blurInput"
           @keydown.up="prevItem"
           @keydown.down="nextItem"
           @keydown.enter.prevent=""
           @keyup.enter.prevent="enterItem"
           @keydown.delete="deleteTextOrItem"/>
    <div class="text"
         :class="textClass" :data-vss-custom-attr="searchTextCustomAttr">{{inputText}}
    </div>
    <div class="menu"
         ref="menu"
         @mousedown.prevent
         :class="menuClass"
         :style="menuStyle"
         @scroll="onScroll"
         tabindex="-1">
      <template v-for="(option, idx) in allOptions">
        <div
          class="item"
          :key="idx"
          :class="{ 'selected': option.selected, 'current': pointer === idx }"
          :data-vss-custom-attr="customAttrs[idx] ? customAttrs[idx] : ''"
          @click.stop="selectItem(option)"
          @mousedown="mousedownItem"
          @mouseenter="pointerSet(idx)">
          {{option.text}}
        </div>
      </template>
    </div>
  </div>
</template>

<script src="./AjaxBasicSelect.js"></script>

<style scoped lang="scss">
  @import "~/semantic-ui-css/semantic.min.css";
</style>

<style>
  /* custom icon float right*/
  .ui .dropdown.icon-right {
    float: right;
  }
  /* Menu Item Hover */
  .ui.dropdown .menu > .item:hover {
    background: none transparent !important;
  }

  /* Menu Item Hover for Key event */
  .ui.dropdown .menu > .item.current {
    background: rgba(0, 0, 0, 0.05) !important;
  }
  .ui.search.disabled{
    opacity: 1 !important;
    background: #eceeef !important;
  }
</style>
