<template>
  <div data-e2e-type="image-cropper-container" class="image-cropper-main-div mt-4" :class="{ 'blur-loading-row': loading, 'crop-window-visible': uploadedImage }">
    <div class="container mt-2" :class="customClass">
      <div class="row align-items-center">
        <div class="col-4 align-self-center">
          <div class="btn-group" v-if="!uploadedImage">
            <button
              data-e2e-type="image-cropper-upload-button"
              type="button"
              class="btn btn-primary" @click="sendFireUploadEvent($event)">Upload image
            </button>
            <input ref="fileUpload" data-e2e-type="image-cropper-input" type="file" name="file" style="display: none;" accept="image/*" @change="onFileUpload($event)" />
            <button
              type="button"
              data-e2e-type="delete-image"
              class="btn btn-primary btn-block ml-2" @click="deleteImage()">Delete logo
            </button>
          </div>
        </div>
      </div>
      <div class="row align-items-center" v-if="uploadedImage">
        <div class="col-6 canvasContainer">
          <canvas id="canvas"></canvas>
        </div>
        <div class="col-4 ml-2">
          <img :src="croppedImage" />
        </div>
      </div>
      <div class="row align-items-center" v-if="croppedImage" id="image-cropper-actions">
        <div class="col align-self-center">
          <div class="btn-group mt-2" v-if="uploadedImage">
            <button v-if="croppedImage"
              type="button"
              data-e2e-type="crop-image"
              class="btn btn-primary" @click="cropImage()">Crop
              <i
                v-show="loading"
                class="fas fa-spinner fa-pulse fa-fw">
              </i>
            </button>
            <button
              type="button" v-if="croppedImage"
              data-e2e-type="cancel-crop-image"
              class="btn btn-secondary ml-2" @click="cancelCrop()">Cancel / Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./image-cropper.js"></script>

<style scoped lang="scss" src="./image-cropper.scss"></style>
