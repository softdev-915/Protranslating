
<template>
  <div class="col auto-scroll h-100" v-if="initialized" v-on:scroll="onScroll">
      <div :style="upScrollDivStyle"></div>
      <img v-for="p in pages" :key="p" :style="{height: `${pageHeight}px`}" :alt="document.name + ' page ' + p" :src="buildDocumentURL(p)" class="w-100">
      <div :style="downScrollDivStyle"></div>
  </div>
  <div class="col align-self-center text-center" v-else>No content to display</div>
</template>

<script src="./basic-cat-tool-preview.js"></script>
<style lang="scss" scoped src="./basic-cat-tool-preview.scss"></style>

