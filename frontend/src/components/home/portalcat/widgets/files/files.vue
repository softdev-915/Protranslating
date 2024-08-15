<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="portalcat-files-widget">
    <template slot="icon">
      <i :class="iconClass" title="File Browser" data-e2e-type="widget-icon"></i>
    </template>

    <div
      v-for="documentId of documents"
      :key="documentId"
      class="portalcat-files-list-row"
      data-e2e-type="portalcat-files-list-item"
      :class="documentId === activeDocument && 'active'"
      @click="changeActiveDocument(documentId)"
      :title="getDocumentName(documentId)"
    >{{ getDocumentName(documentId) }}</div>
  </widget>
</template>

<script src="./files.js"></script>
<style lang="scss" scoped src="./files.scss"></style>