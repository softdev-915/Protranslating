<template>
  <server-pagination-grid
    ref="AbilityExpenseAccountsGrid"
    grid-name="abilityExpenseAccount"
    title="Abilty Expense Account"
    key-prop="_id"
    :service="abilityExpenseAccountService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./ability-expense-account-grid.js"></script>
