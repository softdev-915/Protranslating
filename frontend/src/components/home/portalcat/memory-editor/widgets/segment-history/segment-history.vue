<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="memory-editor-history-widget">
    <i v-if="isHistoryLoading" class="fas fa-spinner in-progress"></i>
    <template v-else>
      <segment-history-item
        v-for="(segment, index) of historySegments"
        :segments="historySegments"
        :segmentIndex="index"
        :key="segment._id"
        :segment="segment"/>
    </template>
  </widget>
</template>

<script src="./segment-history.js"></script>