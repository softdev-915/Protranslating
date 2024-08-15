<template>
  <div>
    <server-pagination-grid
      ref="accountsGrid"
      grid-name="accounts"
      title="Chart of Accounts"
      key-prop="_id"
      :service="service"
      :can-create="canCreate"
      @grid-edit="onEdit"
      @grid-create-new="onCreateNew"
    />
  </div>
</template>
<script src="./revenue-accounts-grid.js" />