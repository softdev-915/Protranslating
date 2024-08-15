<template>
  <section-container :title="'Requests'" :class="requestSectionClass">
    <request-section v-if="canReadQuotes || canReadRequests" ref="breadcrumb"></request-section>
    <h4 v-else>You are not authorized to access this resource</h4>
    <template slot="full-height">
      <router-view name="portalcat"></router-view>
    </template>
  </section-container>
</template>

<script src="./index.js"></script>
