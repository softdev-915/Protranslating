<template>
  <div class="p-1">
    <div v-if="notAllowedEntities.length !== 0">
      <small class="text-danger">You don't have permission to read {{ notAllowedEntities.join(', ') }} entities</small>
    </div>
    <template v-else-if="hasLastResult">
      <a
        :href="lastResultDoc.url"
        class="btn btn-primary"
        :data-e2e-type="`custom-query-${item.name}-download-last-result`"
        @click.stop="downloadDocument($event, lastResultDoc)">
        <i class="fas fa-download"></i>
      </a>
      <iframe-download :ref="`iframe_doc_${lastResultDoc._id}`"/>
    </template>
  </div>
</template>

<script src="./custom-query-grid-last-result.js"></script>
