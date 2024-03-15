<template>
  <div class="row flex-nowrap" :class="{'highlightedTask': isOwnTask, 'align-items-center': !canEditAll }" data-e2e-type="workflow-provider-task">
    <div class="col-6 workflow-provider-tool-container">
      <div class="row flex-nowrap workflow-provider-task p-0">
        <div class="col-10 workflow-provider-container">
          <div v-if="canReadRegulatoryFieldsOfProviderTask" class="row pb-1">
            <div
              class="read-only-box font-weight-bold"
              title="Provider"
              data-e2e-type="workflow-provider-task-provider-readonly"
              >
              {{providerName}}
            </div>
          </div>
          <div class="row pb-1" v-if="this.canReadProviderInstructions">
            <div title="Provider task instructions" class="read-only-box shrink-container" data-e2e-type="workflow-provider-task-instructions-read-only">
              {{providerTask.instructions}}
            </div>
          </div>
          <div class="row pb-1">
            <div title="Provider task due date" class="read-only-box" data-e2e-type="workflow-provider-task-due-date-read-only">
              {{ taskDueDateReadOnly }}
            </div>
          </div>
          <div class="row pt-2">
            <div title="Provider task status" class="read-only-box" data-e2e-type="workflow-provider-task-status-read-only">
            {{ statusText }}
            </div>
          </div>
          <i v-show="isProgressLoading" class="fas fa-spinner fa-pulse fa-fw"></i>
          <div class="w-100" v-if="!isProgressLoading && (taskProgress || taskProgress === 0)">
            <provider-task-progress v-model="taskProgress" :hasQaIssues="hasQaIssues"/>
          </div>
        </div>
        <div class="col-2 p-0">
          <div class="col-12 mb-1">
                <i
                  tabindex="-1"
                  title="Task Files"
                  class="fas fa-tasks disabled"
                  :class="{'button-active': hasFiles }"
                  data-e2e-type="workflow-provider-task-files-button-read-only"></i>
            </div>
            <div v-if="canReadNotes"  class="col-12 mb-1">
                <i tabindex="-1" data-e2e-type="workflow-provider-task-notes-button-read-only" class="fas fa-file-text disabled" :class="{'button-active': hasNotes }"></i>
            </div>
        </div>
      </div>
      <div class="row" v-if="canReadFinancialSections">
        <div class="col-12 pl-0">
          Min Charge: <b data-e2e-type="provider-task-min-charge">{{providerTask.minCharge | toCurrency }}</b>
        </div>
        <div class="col-12 mt-2 pl-0">
          Task amount: <b data-e2e-type="provider-task-total-amount">{{ providerTask.total | toCurrency }}</b>
        </div>
      </div>
    </div>
    <div class="col-12 provider-task-bill-container" data-e2e-type="provider-task-bill-container" v-if="canReadFinancialSections" v-show="toggledSections.billVisible">
      <div data-e2e-type="bill-container" v-for="(billDetail, index) in providerTask.billDetails" :key="billDetail.key">
        <provider-task-bill-read-only
          :bill="billDetail"
          :class="{'first': index === 0}"/>
          <hr v-show="!isLastBillDetails(index)" class="dashed-line">
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./workflow-provider-task-detail.scss"></style>

<script src="./workflow-provider-task-detail-read-only.js"></script>
