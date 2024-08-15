<template>
  <section-container :title="'User management'">
    <user-section v-if="canRead" ref="userBreadcrumb"></user-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
