<template>
  <div>
    <server-pagination-grid
      grid-name="taskGrid"
      title="Tasks"
      :query="query"
      :key-prop="keyProp"
      :service="taskService"
      :can-sort="canSort"
      :can-create="false"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./task-grid.js"></script>
