<template>
  <section-container :title="'company-department-relationship management'">
    <company-department-relationship-section v-if="canRead">
    </company-department-relationship-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
