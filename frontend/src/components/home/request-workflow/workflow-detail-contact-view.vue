<template>
  <div class="col-12" data-e2e-type="workflow-contact-view">
    <workflow-title
      :srcLang="srcLang"
      :tgtLang="tgtLang"
      :is-collapsed="collapsed"
      :workflow-index="workflowIndex"
      @on-toggle-collapsed="toggleCollapse" />
    <workflow-task-detail-contact-read-only
      v-if="!collapsed"
      :workflow="workflow"
      :srcLang="srcLang"
      :tgtLang="tgtLang"
    />
  </div>
</template>

<style scoped lang="scss" src="./workflow-detail-contact-view.scss"></style>

<script src="./workflow-detail-contact-view.js"></script>
