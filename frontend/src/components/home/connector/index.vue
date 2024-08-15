<template>
  <section-container :title="'Connector management'">
    <connector-section v-if="hasRole('CONNECTOR_READ_ALL')" />
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
