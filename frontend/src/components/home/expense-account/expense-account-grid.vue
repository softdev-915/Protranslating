<template>
  <server-pagination-grid
    ref="ExpenseAccountsGrid"
    grid-name="expenseAccount"
    title="Expense Account"
    key-prop="number"
    :service="expenseAccountService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./expense-account-grid.js"></script>
