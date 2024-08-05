<template>
  <div>
    <div class="row align-items-center pt-5">
      <iframe-download
        v-if="!noIframe"
       :url="fileUrl"
       :downloadOnCreate="true"
        @download-error="onDownloadError"
        @download-finished="onDownloadFinished" />
      <div class="col-12 text-center">
        <h4>{{ message }} <a v-show="noIframe" :ref="'downloadLink'">here</a></h4>
      </div>
    </div>
    <div class="row" v-if="hasError">
      <div class="col-12 text-center red-text">
        <h5>{{ error }}</h5>
      </div>
    </div>
  </div>
</template>

<script src="./get-file.js"></script>