<template>
  <section-container :title="sectionTitle">
    <active-user-sessions-section v-if="canRead" ref="breadcrumb"></active-user-sessions-section>
    <h4 v-if="!canRead">You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>