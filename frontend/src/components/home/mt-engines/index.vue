<template>
  <section-container :title="'MT engines management'">
    <mt-engines-section v-if="hasRole('MT-ENGINES_READ_ALL')"></mt-engines-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
