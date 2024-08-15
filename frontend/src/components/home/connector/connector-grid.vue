<template>
  <div>
    <server-pagination-grid
      :query="query"
      key-prop="_id"
      grid-name="connectorGrid"
      title="connectors Grid"
      :service="service"
      :can-create="false"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./connector-grid.js"></script>
