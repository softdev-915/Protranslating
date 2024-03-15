<template>
  <div>
    <server-pagination-grid
      ref="bankAccountsGrid"
      grid-name="bankAccounts"
      title="Bank Accounts"
      key-prop="_id"
      :service="service"
      :can-create="canCreate"
      @grid-edit="onEdit"
      @grid-create-new="onCreateNew"
    />
  </div>
</template>
<script src="./bank-account-grid.js"/>
