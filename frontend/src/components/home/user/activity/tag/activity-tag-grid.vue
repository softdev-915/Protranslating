<template>
  <div>
    <server-pagination-grid
      ref="activityTagInlineGrid"
      grid-name="activityTagInlineGrid"
      title=""
      :query="query"
      key-prop="_id"
      :service="activityTagService"
      :can-create="canCreate"
      @grid-edit-save="onEditSave($event)"
      @grid-refresh="onRefresh($event)"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./activity-tag-grid.js"></script>

