<template>
  <div
    v-show="loadComponents"
    class="row flex-nowrap task-container pl-0 task-description-modal"
    :class="{'task-included-in-group': isTaskIncludedInGroup }"
    data-e2e-type="workflow-task"
  >
    <b-modal
      size="lg"
      v-if="canReadTaskDescription"
      static
      hide-header-close
      :no-fade="true"
      ref="descriptionModal"
      :id="'task-description'"
    >
      <div slot="modal-header">
        <h6>Task description</h6>
      </div>
      <div slot="default">
        <div class="container-fluid">
          <div class="editor-container">
            <textarea
              tabindex="0"
              class="form-control"
              placeholder="Description"
              data-e2e-type="task-description"
              v-model="taskDescription"
            ></textarea>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button
          data-e2e-type="task-description-close-btn"
          class="btn btn-secondary pull-right"
          @click="hideTaskDescription()"
        >Close</button>
      </div>
    </b-modal>
    <input data-e2e-type="task-id" type="hidden" v-model="task._id" disabled>
    <div class="col-2 mb-2 pr-0 task-ability-container">
      <div v-if="canEditAll" :class="{'has-danger': !isAbilityValid}">
        <ability-ajax-basic-select
          tabindex="0"
          data-e2e-type="workflow-task-ability"
          :selected-option="abilitySelected"
          :fetch-on-created="false"
          :is-disabled="isAbilitySelectDisabled || !this.canEditTask"
          @select="onAbilitySelect"
          placeholder="Ability"
          title="Ability list"
        />
      </div>
      <div v-else-if="canReadRegulatoryFieldsOfTask" class="pb-1 font-weight-bold" data-e2e-type="workflow-task-ability-read-only">
        {{ abilitySelected.text }}
      </div>
      <textarea
        v-if="canReadTaskDescription"
        tabindex="0"
        placeholder="Task description"
        data-e2e-type="task-description-activator"
        title="Task description"
        @click="showTaskDescription()"
        :disabled="!this.canEditTask"
        class="form-control form-control-sm"
        v-model="taskDescription"
      ></textarea>
      <input
        title="Workflow Task Status"
        v-if="canReadTaskStatus"
        placeholder="Workflow Task Status"
        data-e2e-type="workflow-task-status-readonly"
        class="form-control mt-1 disabled"
        :value="task.status"
        readonly
      />
      <div class="row pl-0 mt-2" v-if="canReadFinancialSections">
        <div class="col-12 pr-0">
          Min Charge: <b data-e2e-type="task-min-charge">{{ task.minCharge | toCurrency }}</b>
        </div>
        <div class="col-12 mt-2 pr-0">
          Task amount: <b data-e2e-type="task-total-amount">{{ task.total | toCurrency }}</b>
        </div>
      </div>
      <div v-if="canReadAll" class="row mt-2">
        <div class="col-12 pl-2">
          <div class="btn-group" role="group" aria-label="Task actions">
            <button tabindex="-1" title="Add task" @click.prevent="addTask()" class="fas fa-plus" data-e2e-type="workflow-add-task-button"></button>
            <button
              tabindex="-1"
              :disabled="hasApprovedCompletedProviderTasks"
              title="Delete task"
              class="fas fa-close"
              data-e2e-type="workflow-delete-task-button"
              @click.prevent="deleteTask()"
            ></button>
            <button
              tabindex="-1"
              title="Move task up"
              class="fas fa-arrow-up"
              data-e2e-type="workflow-move-up-task-button"
              @click.prevent="moveTask(-1)"
            ></button>
            <button
              tabindex="-1"
              title="Move task down"
              class="fas fa-arrow-down"
              data-e2e-type="workflow-move-down-task-button"
              @click.prevent="moveTask(1)"
            ></button>
          </div>
        </div>
      </div>
      <import-analysis-button
        data-e2e-type="invoice-import-memoq-analysis"
        v-if="canCreateAllRequest"
        tooltip="Import Analysis for Invoice"
        custom-class="memoq-invoice-button"
        :can-upload-analysis="canUploadMemoq"
        :parse-func="parseInvoice"
        @show-analysis-modal="showAnalysisModal"
      />
    </div>
    <div class="col-10">
      <div class="row pl-0 flex-nowrap">
        <div v-if="canReadFinancialSections" class="col-6 invoice-container" data-e2e-type="task-invoice-container" v-show="toggledSections.invoiceVisible">
          <div
            data-e2e-type="invoice-detail-container"
            v-for="(_invoiceDetail, index) in task.invoiceDetails"
            :key="task.invoiceDetails[index].invoice.key"
            class="mb-2"
          >
            <task-invoice
              v-model="task.invoiceDetails[index].invoice"
              :task-id="task._id"
              :toggled-sections="toggledSections"
              :class="{'first': index === 0}"
              :ability="abilitySelected"
              :is-foreign-currency-request="isForeignCurrencyRequest"
              :task-status="task.status"
              :can-edit-task="canEditTask"
              :currencies="currencies"
              :company-rates="companyRates"
              :request="request"
              :original-request="originalRequest"
              :original-workflow="originalWorkflow"
              :invoice-index="index"
              :workflow="workflow"
              :all-approved-completed-provider-tasks="allApprovedCompletedTasks"
              :has-approved-completed-provider-tasks="hasApprovedCompletedProviderTasks"
              @invoice-detail-add="onInvoiceDetailAdd"
              @invoice-detail-delete="onInvoiceDetailDelete"
              @unit-price-filter-change="onUnitPriceFilterChange"
            />
          </div>
        </div>
         <div
           v-if="canReadFinancialSections"
           class="col-6 projected-cost-container"
           data-e2e-type="task-projected-cost-container"
           v-show="toggledSections.projectedCostVisible && canReadFinancialSections"
         >
          <div
            data-e2e-type="projected-cost-detail-container"
            v-for="(projectedCost, index) in task.invoiceDetails"
            :key="`${taskIndex}-projected-cost-${index}`"
          >
            <task-projected-cost
              v-model="task.invoiceDetails[index].projectedCost"
              :workflow="workflow"
              :task="task"
              :provider-tasks="task.providerTasks"
              :toggled-sections="toggledSections"
              :class="{'first': index === 0}"
              :ability="abilitySelected"
              :currencies="currencies"
              :company-rates="companyRates"
              :request="request"
              :is-section-visible="toggledSections.projectedCostVisible"
              :projected-cost-index="index"
            />
          </div>
        </div>
        <div class="col-6 ml-2" data-e2e-type="workflow-provider-tasks" v-if="loadComponents">
          <span v-for="(providerTask, index) in providerTasks" :key="providerTask._id || index">
          <workflow-provider-task-detail
            :task="task"
            :original-task="originalValue"
            :value="providerTask"
            :ability="abilitySelected"
            :workflow="workflow"
            :can-edit-all="canEditAll"
            :is-portal-cat="isPortalCat"
            :breakdowns="breakdowns"
            :currencies="currencies"
            :scheduling-company="schedulingCompany"
            :toggled-sections="toggledSections"
            :workflow-task-files-modal-state="workflowTaskFilesModalState"
            :provider-task-index="index"
            :requestStatus="requestStatus"
            :has-approved-cancelled-tasks="hasApprovedCancelledTasks"
            :has-approved-completed-provider-tasks="hasApprovedCompletedProviderTasks"
            :translationUnits="translationUnits"
            :pc-errors="pcErrors"
            :provider-task-progress="getProviderTaskProgress(providerTask)"
            :is-task-included-in-group="isTaskIncludedInGroup"
            :is-progress-loading="isProgressLoading"
            :is-user-ip-allowed="isUserIpAllowed"
            :workflow-language-combination="workflowLanguageCombination"
            :can-read-regulatory-fields-of-workflow="canReadRegulatoryFieldsOfWorkflow"
            @input="onProviderTaskUpdate(index, $event)"
            @provider-add="onProviderAdd(index)"
            @provider-delete="onProviderDelete(index)"
            @provider-task-status-update="onProviderTaskStatusUpdate"
            @provider-task-quote-add="onProviderTaskQuoteAdd(index)"
            @provider-task-quote-delete="onProviderTaskQuoteDelete(index)"
            @workflow-file-show="onWorkflowFileShow(index, $event)"
            @workflow-note-edit="onWorkflowNoteEdit(index, $event)"
            @show-confirm-dialog="$emit('show-confirm-dialog', $event)"
            @workflow-assign-trigger-modal="onWorkflowAssignTriggerModal($event)"
            @workflow-linguistic-task-provider-selected="onWorkflowLinguisticTaskProviderSelected($event)"
            @workflow-reflow-trigger-modal="$emit('workflow-reflow-trigger-modal', $event)"
            v-bind="wrappedProps"
            v-on="wrappedListeners"
          />
          <hr v-show="!isLastProviderTask(index)" class="dashed-line">
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./workflow-task-detail-global.scss"></style>
<style scoped lang="scss" src="./workflow-task-detail.scss"></style>

<script src="./workflow-task-detail.js"></script>
