<template>
  <section-container :title="'Payment methods management'">
    <payment-method-section v-if="canRead"></payment-method-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
