<template>
  <div>
    <server-pagination-grid
      :query="query"
      key-prop="_id"
      grid-name="locationGrid"
      title="Locations Grid"
      :service="service"
      :can-create="canCreate"
      @grid-create-new="onCreate"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./location-grid.js"></script>
