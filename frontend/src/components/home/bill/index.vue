<template>
  <section-container :title="'bill management'">
    <bill-section v-if="canRead"></bill-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
