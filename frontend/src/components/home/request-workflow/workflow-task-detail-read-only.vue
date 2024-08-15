<template>
  <div
    v-show="loadComponents" 
    class="row flex-nowrap task-container pl-0 task-description-modal"
    data-e2e-type="workflow-task"
  >
    <div class="col-2 mb-2 pr-0 task-ability-container">
      <div
        v-if="canReadRegulatoryFieldsOfTask"
        title="Ability"
        class="read-only-box my-1"
        data-e2e-type="workflow-task-ability-read-only"
      >
        {{ task.ability }}
      </div>
      <div
        v-if="canReadTaskDescription"
        title="Task description"
        class="read-only-box my-1"
        data-e2e-type="workflow-task-description-read-only"
      >
        {{ task.description }}
      </div>
      <div
        v-if="canReadTaskStatus"
        title="Workflow Task Status"
        class="read-only-box my-1"
        data-e2e-type="workflow-task-status-read-only"
      >
        {{ task.status }}
      </div>
      <div class="row pl-0 mt-2" v-if="canReadFinancialSections">
        <div class="col-12 pr-0">
          Min Charge:
          <b data-e2e-type="task-min-charge">{{
            task.minCharge | toCurrency
          }}</b>
        </div>
        <div class="col-12 mt-2 pr-0">
          Task amount:
          <b data-e2e-type="task-total-amount">{{ task.total | toCurrency }}</b>
        </div>
      </div>
    </div>
    <div class="col-10">
      <div class="row pl-0 flex-nowrap">
        <div
          v-if="canReadFinancialSections"
          class="col-6 invoice-container"
          data-e2e-type="task-invoice-container"
          v-show="toggledSections.invoiceVisible"
        >
          <div
            data-e2e-type="invoice-detail-container"
            v-for="(invoiceDetail, index) in task.invoiceDetails"
            :key="invoiceDetail.invoice._id"
            class="mb-2"
          >
            <task-invoice-read-only
              :invoice="invoiceDetail.invoice"
              :class="{ first: index === 0 }"
              :is-foreign-currency-request="isForeignCurrencyRequest"
            />
          </div>
        </div>
        <div
          v-if="canReadFinancialSections"
          class="col-6 projected-cost-container"
          data-e2e-type="task-projected-cost-container"
          v-show="
            toggledSections.projectedCostVisible && canReadFinancialSections
          "
        >
          <div
            data-e2e-type="projected-cost-detail-container"
            v-for="(invoiceDetail, index) in task.invoiceDetails"
            :key="`${taskIndex}-projected-cost-${index}`"
          >
            <task-projected-cost-read-only
              :projected-cost="invoiceDetail.projectedCost"
              :class="{ first: index === 0 }"
              :is-section-visible="toggledSections.projectedCostVisible"
            />
          </div>
        </div>
        <div
          class="col-6 ml-2"
          data-e2e-type="workflow-provider-tasks"
        >
          <div v-for="(providerTask, index) in task.providerTasks">
            <workflow-provider-task-detail-read-only
              :key="providerTask._id || index"
              :provider-task="providerTask"
              :can-edit-all="canEditAll"
              :can-read-regulatory-fields-of-workflow="canReadRegulatoryFieldsOfWorkflow"
              :toggled-sections="toggledSections"
              :task="task"
              :request="request"
              :workflow="workflow"
              :provider-task-progress="getProviderTaskProgress(providerTask)"
              :is-progress-loading="isProgressLoading"
              :is-previous-provider-task-finished="isPreviousProviderTaskFinished"
              :is-task-included-in-group="isTaskIncludedInGroup"
              :is-user-ip-allowed="isUserIpAllowed"
              :is-portal-cat="isPortalCat"
              :pc-errors="pcErrors"
            />
            <hr v-show="!isLastProviderTask(index)" class="dashed-line">
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./workflow-task-detail.scss"></style>
<script src="./workflow-task-detail-read-only.js">