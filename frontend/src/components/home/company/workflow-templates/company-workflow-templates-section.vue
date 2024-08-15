<template>
  <section class="container-fluid mb-4"  data-e2e-type="workflows-template-grid">
    <button
      class="btn btn-primary mb-2"
      data-e2e-type="workflow-templates-toggle-button"
      @click="toggleSection"
      >{{ toggleButtonText }}</button>
    <div class="collapsable" :class="{ expanded: isExpanded }">
      <div class="collapsable-content">
        <h5 class="my-2">Company Workflow Templates</h5>
        <hr>
        <server-pagination-grid
          class="company-workflow-template-grid"
          v-if="isGridShown"
          shouldRetrieveColumns
          force-query-params
          title="CompanyWorkflowTemplates"
          grid-name="workflowTemplatesGrid"
          key-prop="_id"
          :components="components"
          :query="query"
          :service="service"
          :can-create="false"
          :can-edit="false"
          :can-export="false"
        />
      </div>
    </div>
  </section>
</template>

<script src="./company-workflow-templates-section.js" />

<style src="./company-workflow-templates-section.scss" lang="scss"  scoped>
