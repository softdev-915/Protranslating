<template>
<div data-e2e-type="logo-image-change-container" class="container logo-image-main-div w-100 container" :class="{ 'blur-loading-row': loading }">
  <div class="row align-items-center">
    <div class="col-12 col-md-2 pl-2">Logo</div>
    <div class="col-12 col-md-10" :class="{'pl-0': !hasLogo}">
      <div class="row d-flex align-items-center h-100">
        <div class="col-12 pt-2 lsp-logo pl-0" :class="{'pt-3': !hasLogo }" data-e2e-type="lsp-logo-image" v-if="hasLogo">
          <img width="180" class="img-responsive" :src="lspLogo" :alt="lsp.name" />
        </div>
        <div v-if="canEdit" class="image-crop-container pt-0">
          <image-cropper
            :custom-class="'pl-3'"
            :loading="loading"
            @on-crop-image="onCropImage"
            @on-image-delete="onDeleteImage">
          </image-cropper>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script src="./lsp-logo-image.js"></script>

<style lang="scss" src="./lsp-logo-image.scss"></style>