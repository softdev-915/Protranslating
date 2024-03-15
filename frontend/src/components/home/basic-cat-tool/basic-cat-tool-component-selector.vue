<template>
  <b-dropdown variant="secondary btn-icon fas fa-bars" :right="right">
    <div class="dropdown-item" :class="{'pts-clickable': c !== value, 'font-weight-bold': c === value, 'disabled': c === value}" v-for="c in components" :key="c" @click="selectComponents(c)">{{c}}</div>
  </b-dropdown>
</template>

<script src="./basic-cat-tool-component-selector.js"></script>
