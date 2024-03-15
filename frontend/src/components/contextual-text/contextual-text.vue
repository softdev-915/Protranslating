<template>
  <div>
    <span v-for="c in context" class="contextual-text" :class="{'contextual-mark': search && c.indexOf(search) >= 0}">{{c}}</span>
  </div>
</template>

<script src="./contextual-text"></script>

<style scoped lang="scss" src="./contextual-text.scss"></style>
