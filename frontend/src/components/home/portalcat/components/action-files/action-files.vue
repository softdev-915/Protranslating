<template>
  <div class="portalcat-pipeline-action-files">
    <div class="row mb-2 align-items-center" v-for="(file, index) of files" :key="file.fileId">
      <iframe-download :ref="`fileIframe-${file.fileId}`" :url="actionFileUrls[index]"></iframe-download>
      <div class="col-auto filename">
        <span>{{ file.fileName }}</span>
      </div>
      <div class="col-auto">
        <a href="#" class="btn btn-link btn-sm" @click.prevent="downloadFile(file.fileId)">
          <i class="fas fa-download"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script src="./action-files.js"></script>
<style lang="scss" scoped src="./action-files.scss"></style>