<template>
  <section-container :title="'expense-account management'">
    <expense-account-section v-if="canRead"></expense-account-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
