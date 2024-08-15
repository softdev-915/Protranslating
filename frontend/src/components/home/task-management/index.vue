<template>
  <section-container :title="'Tasks'" :class="taskSectionClass">
    <task-section v-if="canRead" ref="taskBreadcrumb"></task-section>
    <h4 v-else>You are not authorized to access this resource</h4>
    <template slot="full-height">
      <router-view name="portalcat"></router-view>
      <router-view name="memory-editor"></router-view>
    </template>
  </section-container>
</template>

<script src="./index.js"></script>
