<template>
  <div class="ui fluid multiple search selection dropdown"
       :class="{ 'active visible':showMenu, 'error': isError, 'disabled': isDisabled }"
       @click="openOptions"
       @focus="openOptions">
    <i class="dropdown icon"></i>
    <template v-for="(option, idx) in selectedOptions">
      <a class="ui label transition visible"
         :key="idx"
         style="display: inline-block !important;"
         :data-vss-custom-attr="customAttr(option)"
         :class="{ 'clickable': selectedOptionsClickable, 'not-removable': nonRemovableValues.has(option.value) }"
         @click="onSelectedOptionClick($event, option)">
        {{option.text}}<i class="delete icon" @click="deleteItem(option)"></i>
      </a>
    </template>
    <input class="search"
           autocomplete="off"
           tabindex="0"
           v-model="searchText"
           ref="input"
           :style="inputWidth"
           @focus.prevent="openOptions"
           @keyup.esc="closeOptions"
           @blur="blurInput"
           @keydown.up="prevItem"
           @keydown.down="nextItem"
           @keydown.enter.prevent=""
           @keyup.enter.prevent="enterItem"
           @keydown.delete="deleteTextOrLastItem"/>
    <div class="text"
         :class="textClass">{{inputText}}
    </div>
    <div class="menu"
         ref="menu"
         @mousedown.prevent
         :class="menuClass"
         :style="menuStyle"
         tabindex="-1">
      <template v-for="(option, idx) in filteredOptions">
        <div class="item"
             :key="idx"
             :class="{ 'selected': option.selected, 'current': pointer === idx }"
             :data-vss-custom-attr="customAttr(option)"
             @click.stop="selectItem(option)"
             @mousedown="mousedownItem"
             @mouseenter="pointerSet(idx)">
          {{option.text}}
        </div>
      </template>
    </div>
  </div>
</template>

<script src="./MultiSelect.js"></script>

<style scoped lang="scss">
  @import "~/semantic-ui-css/semantic.min.css";
</style>

<style>
  /* Menu Item Hover for Key event */
  .ui.dropdown .menu > .item.current {
    background: rgba(0, 0, 0, 0.05);
  }
  .clickable {
    pointer-events: all;
  }

  .ui.label.transition.visible.not-removable:hover {
    color: red;
  }
</style>
