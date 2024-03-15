<template>
  <div>
    <server-pagination-grid
      v-if="!loading"
      ref="activityInlineGrid"
      grid-name="activityInlineGrid"
      title=""
      :query="gridQuery"
      key-prop="_id"
      :service="_activityService()"
      :can-create="canCreate"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./activity-grid.js"></script>
