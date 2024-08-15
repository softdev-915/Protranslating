<template>
  <section-container :title="'Ap payment management'">
    <ap-payment-section v-if="canRead"></ap-payment-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
