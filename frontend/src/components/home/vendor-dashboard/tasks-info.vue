<template>
  <div class="tasks col-md px-5 py-3">
    <h6 class="d-inline-block mr-4">Tasks</h6>
    <hr class="mt-1 mb-4" />
    <div
      class="task-info d-flex justify-content-between my-3"
    >
      <span>Current tasks</span>
      <span data-e2e-type="vendor-dashboard-current-tasks">{{ currentTasksCount }}</span>
    </div>
    <div
      class="task-info d-flex justify-content-between my-3"
    >
      <span>Pending tasks</span>
      <span data-e2e-type="vendor-dashboard-pending-tasks">{{ pendingTasksCount }}</span>
    </div>
    <div
      class="task-info d-flex justify-content-between my-3"
    >
      <span>Future tasks</span>
      <span data-e2e-type="vendor-dashboard-future-tasks">{{ futureTasksCount }}</span>
    </div>
    <div
      class="task-info d-flex justify-content-between my-3"
    >
      <span>Total tasks</span>
      <span data-e2e-type="vendor-dashboard-total-tasks">{{ totalTasksCount }}</span>
    </div>
  </div>
</template>

<script src="./tasks-info.js"></script>