<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="memory-editor-details-widget">
    <i v-if="areDetailsLoading" class="fas fa-spinner in-progress"></i>
    <template v-else-if="segmentDetails">
      <p class="mb-1">Created by: <span data-e2e-type="details-created-by">{{ createdBy }}</span></p>
      <p class="mb-1">Created at: {{ createdAt | localDateTime('MM-DD-YYYY HH:mm') }}</p>
      <p class="mb-1">Last modified by: <span data-e2e-type="details-last-modified-by">{{ updatedBy }}</span></p>
      <p class="mb-1">Last used at: <span data-e2e-type="details-last-used-at">{{ usedAt | localDateTime('MM-DD-YYYY HH:mm') }}</span></p>
      <p>Last used in: <span data-e2e-type="details-last-used-in">{{ usedBy }}</span></p>
    </template>
  </widget>
</template>

<script src="./segment-details.js"></script>