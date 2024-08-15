<template>
  <section-container :title="'ability-expense-account management'">
    <ability-expense-account-section v-if="canRead"></ability-expense-account-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
