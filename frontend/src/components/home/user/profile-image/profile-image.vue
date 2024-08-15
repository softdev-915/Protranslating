<template>
  <section-container :class="{'blur-loading': loading}" :title="'Profile image upload'" class="user-profile-image-container">
    <image-cropper
      :loading="loading"
      :aspect-ratio="1"
      @on-crop-image="onCropImage"
      @on-image-delete="onLogodelete">
    </image-cropper>
  </section-container>
</template>

<script src="./profile-image.js"></script>

<style lang="scss" src="./profile-image.scss"></style>