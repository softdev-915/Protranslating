<template>
    <div
      class="workflow-title"
      :class="{'workflow-title-collapsed': isCollapsed}">
      <span>Workflow #{{workflowIndex+1}}{{workflowTitle}}</span>
      <a
        @click="toggleCollapse" data-e2e-type="workflow-expand-button"
        title="Expand/Collapse tasks">
        <i class="pts-clickable fas" :class="toggleIconClass" aria-hidden="true"></i>
      </a>
    </div>
</template>

<script src="./workflow-title.js"></script>
<style scoped lang="scss" src="./workflow-title.scss"></style>
