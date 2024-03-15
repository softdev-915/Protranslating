<template>
  <div>
    <server-pagination-grid
      grid-name="requestTypeGrid"
      title="Request Type"
      :query="query"
      key-prop="_id"
      :service="requestTypeService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreate($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./request-type-grid.js"></script>

