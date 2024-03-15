<template>
  <section-container :title="'Checks management'">
    <template slot="full-height">
      <ap-print-checks-section v-if="canRead"></ap-print-checks-section>
      <h4 v-else>You are not authorized to access this resource</h4>
    </template>
  </section-container>
</template>

<script src="./index.js"></script>
