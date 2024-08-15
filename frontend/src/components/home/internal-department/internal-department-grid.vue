<template>
  <server-pagination-grid
    ref="internalDepartmentsGrid"
    grid-name="internalDepartment"
    title="LSP Internal Departments"
    key-prop="name"
    :service="internalDepartmentService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./internal-department-grid.js"></script>
