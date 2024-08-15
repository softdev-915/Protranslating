<template>
  <section-container :title="'Billing terms management'">
    <billing-term-section v-if="canRead"></billing-term-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
