<template>
  <div class="container drop-zone-container" :class="classes" ref="dropzone">
    <div class="row align-items-start">
      <div class="col drop-zone align-self-center">
        <i class="fas fa-cloud-upload" aria-hidden="true"></i> Drop files here
      </div>
    </div>
  </div>
</template>

<script src="./drop-files.js"></script>

<style lang="scss" src="./drop-files.scss"></style>
