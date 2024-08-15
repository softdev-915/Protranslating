<template>
  <section-container :title="'Ip Instructions Deadlines'">
    <ip-instructions-deadline-section v-if="canRead"></ip-instructions-deadline-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
