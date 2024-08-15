<template>
  <section-container title="Footer Templates">
    <footer-template-section v-if="canRead"></footer-template-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
