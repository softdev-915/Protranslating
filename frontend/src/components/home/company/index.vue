<template>
  <section-container :title="'Company management'">
    <company-section ref="companyBreadcrumb"></company-section>
    <template slot="full-height">
      <router-view name="memory-editor"></router-view>
    </template>
  </section-container>
</template>

<script src="./index.js"></script>
