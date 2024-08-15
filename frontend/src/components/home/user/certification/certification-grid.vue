<template>
  <div>
    <server-pagination-grid
      :query="query"
      key-prop="_id"
      grid-name="certificationGrid"
      title="Certifications Grid"
      :service="service"
      :can-create="canCreate"
      @grid-create-new="onCreate"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./certification-grid.js"></script>