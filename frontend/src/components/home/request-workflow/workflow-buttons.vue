<template>
  <div class="row align-items-center">
    <div class="col-12 actions pl-3" v-if="canEditAll">
      <input
        id="select-all-workflows"
        v-model="allSelected"
        type="checkbox"
        :disabled="isWorkflowInEditMode"
        class="pts-clickable"
        data-e2e-type="select-all-workflows"
        @click="notifySelectedAll"/>
      <div class="col-12 d-inline">
        <div class="icons-container d-inline">
          <button
              id="copyWorkflows"
              :disabled="!canCopyWorkflow"
              title="Copy Workflows"
              @click.prevent="copySelectedWorkflows()"
              class="fas fa-file"
              :class="{'pts-not-allowed': !canCopyWorkflow}"></button>
          <button
              id="deleteWorkflows"
              :disabled="!canDeleteWorkflow"
              title="Delete Workflows"
              @click.prevent="deleteWorkflows()"
              class="fas fa-close"
              :class="{'pts-not-allowed': !canDeleteWorkflow}"></button>
          <button
              id="pasteWorkflows"
              :disabled="!canPasteWorkflow"
              title="Paste Workflows"
              @click.prevent="pasteWorkflows()"
              class="fas fa-paste"
              :class="{'pts-not-allowed': !canPasteWorkflow}"></button>
          <button
              data-e2e-type="workflow-add-button"
              id="addWorkflow"
              :disabled="!canAddWorkflow"
              title="Add Workflow"
              @click.prevent="addWorkflow()"
              class="fas fa-plus"
              :class="{'pts-not-allowed': !canAddWorkflow}"></button>
        </div>
      </div>
      <div class="col-12 d-inline toggle-actions">
        <label for="toggle-invoice" v-if="canReadFinancialSections">Invoice
          <input
            id="toggle-invoice"
            data-e2e-type="toggle-invoice"
            type="checkbox"
            class="pts-clickable"
            v-model="toggledWorkflowProviderTaskSections.invoiceVisible"
            :disabled="isRequestCompletedOrDelivered">
        </label>
        <label v-if="canReadProjectedCost" for="toggle-projected-cost">Projected cost
          <input
            id="toggle-projected-cost"
            data-e2e-type="toggle-projected-cost"
            type="checkbox"
            class="pts-clickable"
            v-model="toggledWorkflowProviderTaskSections.projectedCostVisible"
            :disabled="isRequestCompletedOrDelivered">
        </label>
        <label for="toggle-bill" v-if="canReadFinancialSections">Bill
          <input
            id="toggle-bill"
            data-e2e-type="toggle-bill"
            type="checkbox"
            class="pts-clickable"
            v-model="toggledWorkflowProviderTaskSections.billVisible"
            :disabled="isRequestCompletedOrDelivered">
        </label>
      </div>
    </div>
  </div>
</template>

<script src="./workflow-buttons.js"></script>
