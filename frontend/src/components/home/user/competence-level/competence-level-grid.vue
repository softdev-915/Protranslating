<template>
  <div>
    <server-pagination-grid
      ref="competenceLevelInlineGrid"
      grid-name="competenceLevelInlineGrid"
      title=""
      :query="query"
      key-prop="_id"
      :service="competenceLevelService"
      :can-create="canCreate"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./competence-level-grid.js"></script>

