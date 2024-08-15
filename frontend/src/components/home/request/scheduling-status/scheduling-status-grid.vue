<template>
  <div>
    <server-pagination-grid
      grid-name="requestTypeGrid"
      title="Request Type"
      :query="query"
      key-prop="_id"
      :service="schedulerStatusService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreate($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./scheduling-status-grid.js"></script>

