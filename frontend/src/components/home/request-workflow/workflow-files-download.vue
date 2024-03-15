<template>
  <div>
    <div v-for="doc in documents" :key="doc._id || doc.url">
      <iframe-download
        :ref="`iframeDownload_${doc._id}`"
        :url="doc.url"
        :download-on-create="true"
        @download-finished="onDownloadFinished(doc)"
        @download-error="onDownloadError($event, doc)">
      </iframe-download>
    </div>
  </div>
</template>

<script src="./workflow-files-download.js"></script>
