<template>
  <section-container :title="'Ability management'">
    <ability-section v-if="canRead" ref="userBreadcrumb"></ability-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
