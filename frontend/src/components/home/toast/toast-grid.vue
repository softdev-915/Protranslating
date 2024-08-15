<template>
  <div>
    <server-pagination-grid
      grid-name="toastGrid"
      title="Toast"
      :query="query"
      key-prop="_id"
      :service="toastService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreate($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./toast-grid.js"></script>

