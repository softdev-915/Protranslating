<template>
  <div class="portalcat-action" data-e2e-type="portalcat-action">
    <iframe-download v-if="isDownloadsAvailable && isSingleDownload" :ref="`fileIframe-${downloads[0].fileId}`" :url="actionFileUrl"></iframe-download>
    <div class="action-controls">
      <span class="ml-2 name">{{ name }}</span>
      <div class="controls">
        <i v-if="!!info" class="fas fa-info" :title="info"></i>
        <a
          href="#"
          class="btn btn-link btn-sm download"
          :aria-disabled="!isDownloadsAvailable || isInProgress || isPipelinesLoading"
          :tabindex="isDownloadsAvailable ? 0 : -1"
          :class="{ disabled: !isDownloadsAvailable || isInProgress || isPipelinesLoading }"
          title="Download Action File(s)"
          @click.prevent="downloadFiles">
          <i class="fas fa-download"></i>
        </a>
        <a
          href="#"
          v-if="isConfigurable && (canReadActionConfig || canApplyActionConfig)"
          class="btn btn-link btn-sm action-config"
          :aria-disabled="isInProgress || isPipelinesLoading"
          :tabindex="isDownloadsAvailable ? 0 : -1"
          :class="{ disabled: isInProgress || isPipelinesLoading }"
          title="Action config"
          @click.prevent="$emit('action-config', action)">
          <i class="fas fa-gear"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script src="./action.js"></script>
<style lang="scss" scoped src="./action.scss"></style>