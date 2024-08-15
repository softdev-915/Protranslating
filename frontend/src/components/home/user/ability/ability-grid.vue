<template>
  <div>
    <server-pagination-grid
      ref="abilityInlineGrid"
      grid-name="abilityInlineGrid"
      title=""
      :query="query"
      key-prop="name"
      :service="abilityService"
      :can-create="canCreate"
      @grid-edit-save="onEditSave($event)"
      @grid-refresh="onRefresh($event)"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./ability-grid.js"></script>

