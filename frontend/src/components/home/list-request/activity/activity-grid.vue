<template>
  <div>
    <server-pagination-grid
      v-if="!loading"
      ref="activityInlineGrid"
      grid-name="activityInlineGrid"
      title="Activities"
      :query="query"
      key-prop="_id"
      :service="_activityService()"
      :can-create="false"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./activity-grid.js"></script>
