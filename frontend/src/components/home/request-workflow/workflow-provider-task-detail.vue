<template>
  <div
    class="row flex-nowrap"
    :class="{'highlightedTask': isOwnTask, 'align-items-center': !canEditAll }"
    data-e2e-type="workflow-provider-task">
    <div class="col-6 workflow-provider-tool-container">
      <!-- Provider list -->
      <div class="row flex-nowrap workflow-provider-task p-0">
        <!-- provider edit -->
        <div class="col-10 workflow-provider-container">
          <div
            class="row pb-1"
            data-e2e-type="workflow-provider-task-provider"
            v-if="canEditProvider">
            <div class="col-12 p-0">
              <user-ajax-basic-select
                id="providerSelect"
                :selected-option="provider()"
                :key="providerFilterKey"
                :fetch-on-created="false"
                tabindex="0"
                title="Provider"
                ref="providerSelect"
                class="form-control"
                :filter="providerFilter"
                @select="onTaskProviderSelect"
                @users-loading="onUsersLoading"
                :class="{'blur-loading-row': loadingProviders, 'provider-escalated': isProviderEscalated}"
                :is-disabled="!(canEditTask || canUpdateRegulatoryFields) || isApprovedOrCancelled || hasActiveOffer">
              </user-ajax-basic-select>
            </div>
          </div>
          <div class="row pb-1" data-e2e-type="workflow-provider-task-provider-readonly" v-else-if="canReadRegulatoryFieldsOfProviderTask">
            <div class="col-12 pl-0 pb-1 font-weight-bold">{{taskProviderName}}</div>
          </div>
          <provider-task-instructions
            v-if="canReadProviderInstructions"
            v-model="providerTask.instructions"
            :can-edit-task="canEditTask"/>
          <!-- Task due -->
          <div class="row" v-if="canEditAll">
            <flatpickr
              data-e2e-type="workflow-provider-task-due-date"
              tabindex="0"
              placeholder="Provider task due date"
              title="Provider task due date"
              v-model="providerTask.taskDueDate"
              :config="datepickerOptions"
              class="form-control"
              :class="[{'has-danger': !isDueDateValid}]"/>
          </div>
          <div class="row pb-1" v-else data-e2e-type="workflow-provider-task-due-date-read-only">
            {{providerTask.taskDueDate | localDateTime('YYYY-MM-DD HH:mm')}}
          </div>
          <!-- Status -->
          <div class="row" v-if="canEditStatus" data-e2e-type="workflow-provider-task-status">
            <div class="col-12 pl-0 pr-0">
              <simple-basic-select
                v-model="providerTask.status"
                tabindex="0"
                placeholder="Status"
                title="Provider task status"
                class="non-focusable"
                :options="providerTaskStatusOptions"
                :format-option="option => option"
                :filter-option="filterStatusOption"/>
            </div>
          </div>
          <!-- Status read only -->
          <div class="row pt-2" v-else data-e2e-type="workflow-provider-task-status-read-only">
            {{ status.text }}
          </div>
          <i v-show="isProgressLoading" class="fas fa-spinner fa-pulse fa-fw"></i>
          <div class="w-100" v-if="!isProgressLoading && (taskProgress || taskProgress === 0)">
            <provider-task-progress v-model="taskProgress" :hasQaIssues="hasQaIssues"/>
          </div>
        </div>

        <!-- Files management-->
        <div class="col-2">
          <div class="row">
            <div class="col-12 pl-0 mb-1">
              <div>
                <button
                  tabindex="-1"
                  title="Reflow"
                  @click.prevent="$emit('workflow-reflow-trigger-modal', { workflowIndex, workflowLanguageCombination })"
                  v-if="isPortalCat && isReflowTask"
                  :disabled="!areAllPrevTasksCompletedOrApproved || !isUserIpAllowed"
                  class="fas fa-tasks"
                  data-e2e-type="workflow-reflow-button">
                </button>
                <button
                  tabindex="-1"
                  title="Assign segments"
                  :disabled="isWorkflowAssignButtonDisabled"
                  @click.prevent="$emit('workflow-assign-trigger-modal', { workflowId, providerId, assigneeType, taskId: task._id })"
                  v-else-if="isPortalCat && isLinguisticTask"
                  class="fas fa-tasks"
                  data-e2e-type="workflow-assign-button">
                </button>
                <button
                  tabindex="-1"
                  title="Task Files"
                  :disabled="!isUserIpAllowed"
                  @click.prevent="manageFiles()"
                  v-else-if="!filesUploadDisabled"
                  class="fas fa-tasks"
                  :class="{'button-active': hasFiles }"
                  data-e2e-type="workflow-provider-task-files-button"></button>
                <span v-else>
                  <i
                    data-e2e-type="workflow-provider-task-files-icon-disabled"
                    class="fas fa-tasks p-1"></i>
                  </span>
              </div>
            </div>
            <div v-if="canReadNotes" class="col-12 pl-0 mb-1">
              <div>
                <button tabindex="-1" v-if="canEditTask" data-e2e-type="workflow-provider-task-notes-button" @click.prevent="showNotes()" class="fas fa-file-text" :disabled="isShowNotesDisabled" :class="{'button-active': providerTask.notes.length }"/>
                <template v-else-if="canEditWorkflow  && !canEditTask && !lockPreviouslyCompleted">
                  <button
                    tabindex="-1"
                    title="Task notes"
                    data-e2e-type="workflow-provider-task-notes-button"
                    @click.prevent="showNotes()"
                    class="fas fa-file-text"
                    :class="{'button-active': providerTask.notes.length }"
                    :disabled="isShowNotesDisabled || (!canReadRegulatoryFieldsOfProviderTask && isApprovedOrCancelled)"/>
                </template>
                <span v-else data-e2e-type="workflow-provider-task-notes-button-read-only">
                  <i class="fas fa-file-text p-1"></i>
                </span>
              </div>
            </div>
            <div class="col-12 pl-0 mb-1" v-if="isPortalCat && isPortalCatSupported">
              <button
                :disabled="!canEnterPortalCat"
                title="PortalCAT"
                data-e2e-type="workflow-provider-task-portal-cat-button"
                @click.prevent="navigateToPortalCat()"
                class="fas fa-globe"
                :class="{ 'button-error': shouldDisplayPcError }">
              </button>
            </div>
            <div class="col-12 pl-0 mt-2" tabindex="-1">
              <import-analysis-button
                data-e2e-type="bill-import-memoq-analysis"
                v-if="canCreateAllRequest"
                tooltip="Import Analysis for Bill"
                custom-class="memoq-bill-button"
                :can-upload-analysis="canUploadMemoq"
                :parse-func="parseBill"
                @show-analysis-modal="$parent.showAnalysisModal"/>
            </div>
            <div class="col-12 pl-0 mt-2" v-if="hasRole('WORKFLOW_UPDATE_ALL')">
              <div class="mt-2">
                <button
                  tabindex="-1"
                  @click.prevent="onAddProvider()"
                  class="fas fa-plus"
                  data-e2e-type="workflow-add-provider-task-button"></button>
              </div>
              <div class="mt-2">
                <button
                  tabindex="-1"
                  class="fas fa-close"
                  :disabled="isReadOnlyProvider"
                  data-e2e-type="workflow-delete-provider-task-button"
                  @click.prevent="onDeleteProvider()"></button>
              </div>
            </div>
            <div class="col-12 pl-0 mt-2">
                <button
                  v-if="isProviderPoolingOfferButtonVisible"
                  tabindex="-1"
                  class="fas fa-paper-plane"
                  data-e2e-type="workflow-provider-pool-offer-button"
                  title="Offer"
                  @click.prevent="navigateToProviderPoolingOffer"></button>
            </div>
          </div>
        </div>
      </div>
      <div class="row" v-if="canReadFinancialSections">
        <div class="col-12 pl-0">
          Min Charge:
            <b data-e2e-type="provider-task-min-charge">{{providerTaskMinimumChargeRate | toCurrency }}</b>
        </div>
        <div class="col-12 mt-2 pl-0">
          Task amount:
            <b data-e2e-type="provider-task-total-amount">{{ providerTaskTotal | toCurrency }}</b>
        </div>
      </div>
    </div>
    <div class="col-12 provider-task-bill-container" data-e2e-type="provider-task-bill-container" v-if="canReadFinancialSections" v-show="toggledSections.billVisible">
      <div data-e2e-type="bill-container" v-for="(billDetail, index) in providerTask.billDetails" :key="billDetail.key">
        <provider-task-bill
          v-model="providerTask.billDetails[index]"
          :task="task"
          :provider="taskProvider"
          :provider-rates="providerRates"
          :toggled-sections="toggledSections"
          :class="{'first': index === 0}"
          :ability="ability"
          :currencies="currencies"
          :company-rates="companyRates"
          :request="request"
          :bill-index="index"
          :sourceLanguage="workflowSrcLang"
          :targetLanguage="workflowTgtLang"
          :providerTaskStatus="providerTask.status"
          :provider-task="providerTask"
          @request-new-rates="onNewRatesRequest"
          @on-set-bill-unit-price="onSetBillUnitPrice" />
          <hr v-show="!isLastBillDetails(index)" class="dashed-line">
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./workflow-provider-task-detail.scss"></style>

<script src="./workflow-provider-task-detail.js"></script>
