<template>
  <div>
    <server-pagination-grid
      grid-name="languageInlineGrid"
      title="Languages"
      :query="query"
      key-prop="name"
      :service="languageService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./language-grid.js"></script>

