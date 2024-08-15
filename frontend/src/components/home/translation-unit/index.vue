<template>
  <section-container :title="'Units management'">
    <translation-unit-section v-if="canRead"></translation-unit-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
