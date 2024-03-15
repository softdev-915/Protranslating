<template>
  <div>
    <server-pagination-grid
      ref="adjustmentsGrid"
      grid-name="adjustments"
      title="Adjustments"
      key-prop="_id"
      :service="service"
      :can-create="canCreate"
      :can-edit="canEdit"
      @grid-edit="onEdit"
      @grid-create-new="onCreateNew"
    />
  </div>
</template>
<script src="./ar-adjustment-grid.js" />