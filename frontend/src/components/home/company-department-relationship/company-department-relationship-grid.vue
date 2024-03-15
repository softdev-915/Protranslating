<template>
  <server-pagination-grid
    ref="CompanyDepartmentRelationshipsGrid"
    grid-name="companyDepartmentRelationship"
    title="Company Department Relationship"
    key-prop="company.name"
    :service="companyDepartmentRelationshipService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./company-department-relationship-grid.js"></script>
