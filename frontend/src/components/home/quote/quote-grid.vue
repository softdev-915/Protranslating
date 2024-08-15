<template>
  <div>
    <server-pagination-grid
      ref="quoteGrid"
      grid-name="quoteGrid"
      title="Quotes"
      key-prop="_id"
      :cache="false"
      :service="quoteLmsService"
      :can-create="canCreate"
      @grid-edit="onEditInline($event)"
      @grid-refresh="onRefresh($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./quote-grid.js"></script>
<style lang="scss" src="./quote-grid.scss"></style>
