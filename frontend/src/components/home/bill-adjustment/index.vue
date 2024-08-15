<template>
  <section-container :title="'bill adjustment management'">
    <bill-adjustment-section v-if="canRead"></bill-adjustment-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
