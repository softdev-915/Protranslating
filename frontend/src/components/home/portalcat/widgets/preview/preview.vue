<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="portalcat-preview-widget">
    <template slot="icon">
      <i :class="iconClass" title="Preview Source and Target" data-e2e-type="widget-icon"></i>
    </template>
  </widget>
</template>

<script src="./preview.js"></script>