<template>
  <div>
    <server-pagination-grid
      ref="advancesGrid"
      grid-name="advances"
      title="Advances"
      key-prop="_id"
      :service="service"
      :can-create="canCreate"
      @grid-edit="onEdit"
      @grid-create-new="onCreateNew"
    />
  </div>
</template>
<script src="./ar-advances-grid.js" />