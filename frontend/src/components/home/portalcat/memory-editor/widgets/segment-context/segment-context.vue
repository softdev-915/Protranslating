<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="memory-editor-context-widget">
    <i v-if="areDetailsLoading" class="fas fa-spinner in-progress"></i>
    <template v-else-if="segmentDetails">
      <template v-if="preSegmentSource || preSegmentTarget">
        <h6>Previous segment</h6>
        <p class="mb-2">{{ preSegmentSource }}</p>
        <p>{{ preSegmentTarget }}</p>
      </template>
      <template v-if="postSegmentSource || postSegmentTarget">
        <h6>Next segment</h6>
        <p class="mb-2">{{ postSegmentSource }}</p>
        <p>{{ postSegmentTarget }}</p>
      </template>
    </template>
  </widget>
</template>

<script src="./segment-context.js"></script>