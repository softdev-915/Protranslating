<template>
  <div>
    <server-pagination-grid
      ref="catToolInlineGrid"
      grid-name="catToolInlineGrid"
      title=""
      :query="query"
      key-prop="name"
      :service="catToolService"
      :can-create="canCreate"
      @grid-edit-save="onEditSave($event)"
      @grid-refresh="onRefresh($event)"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./cat-tool-grid.js"></script>

