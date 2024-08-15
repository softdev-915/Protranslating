<template>
  <div
    data-e2e-type="workflow-main-container"
    class="col-12 workflow-main-container"
    :class="{'red-border': !isValid, 'active': true }"
    @keydown.ctrl.83.prevent.stop="onSave"
  >
    <workflow-header
      :toggled-sections="toggledSections"
      v-model="collapsed"
      :foreign-currency="originalRequest.quoteCurrency.isoCode"
      :show-collapse-icon="showCollapseIcon"
      />
    <div class="row pl-3" data-e2e-type="workflow">
      <div class="col-2 pl-2 workflow-language-container" :class="{'workflow-container': !collapsed }">
        <!-- language -->
        <div class="row mt-2 mb-2 pl-1 pr-3"  v-if="canEditWorkflow">
          <input
            class="form-control pts-clickable float-left"
            type="checkbox"
            v-if="canEditAll"
            :disabled="true"
            v-model="workflowSelected"
            data-e2e-type="workflow-select-checkbox"
          >
          <workflow-detail-buttons
            :is-edit-disabled="true"
            :is-save-disabled="!isValid"
            :show-move-btn="hasMultipleWorkflows && hasNoNewWorkflows"
            :is-move-disabled="true"
            @workflow-save="onSave"
            @workflow-cancel="cancelWorkflowUpdate"
          />
        </div>
        <div class="row" v-if="canEditAll">
          <language-select
            class="col-12"
            data-e2e-type="workflow-source-language"
            :class="[{'has-danger': !isValidSrcLanguage && isValidTargetLanguage}, 'pl-2']"
            tabindex="0"
            :is-disabled="hasApprovedCompletedProviderTasks"
            v-model="workflow.srcLang"
            :fetch-on-created="false"
            title="Workflow source language"
            placeholder="Source"
            :options="availableSourceLanguages"
            :allowSelectedNotInList="true"
            :shouldDisableIfEmptyOptions="true"
          />
        </div>
        <div class="row pl-3" data-e2e-type="workflow-source-language-read-only" v-else>
          <div class="col-12 p-2">
            {{ srcLangName }}
          </div>
        </div>
        <div v-if="canEditAll" class="row">
          <language-select
            class="col-12"
            data-e2e-type="workflow-target-language"
            :class="[{'has-danger': !isValidTargetLanguage && isValidSrcLanguage}, 'pl-2']"
            tabindex="0"
            v-model="workflow.tgtLang"
            :is-disabled="hasApprovedCompletedProviderTasks"
            :excluded-languages="[workflow.srcLang]"
            :fetch-on-created="false"
            title="Workflow target language"
            placeholder="Target"
            :options="availableTargetLanguages"
            :allowSelectedNotInList="true"
            :shouldDisableIfEmptyOptions="true"
          />
        </div>
        <div class="row pl-3" v-else>
          <div title="Workflow target language" class="col-12 p-2" data-e2e-type="workflow-target-language-read-only">
            {{ tgtLangName }}
          </div>
        </div>
        <div class="row" v-if="canReadAll">
          <div v-if="canEditAll" class="col-12 pl-2">
            <flatpickr
              data-e2e-type="workflow-due-date"
              title="workflow due date"
              placeholder="Due date"
              tabindex="0"
              v-model="workflow.workflowDueDate"
              :config="datepickerOptions"
              class="form-control"
              :class="{'form-control-danger': !errors.has('workflow.workflowDueDate'), 'has-danger': !isValidDueDate}"
            />
          </div>
          <div class="pl-3" v-else title="Workflow due date">
            <div class="col-12 pl-2">Workflow due</div>
            <div class="col-12 pl-2 pt-2" data-e2e-type="workflow-due-date-read-only">
              {{ workflow.workflowDueDate | localDateTime('MM-DD-YYYY HH:mm') }}
            </div>
          </div>
        </div>
        <div class="row">
          <div v-if="canReadAll" class="col-12 pl-2" title="Workflow description" data-e2e-type="workflow-description">
            <textarea
              v-if="canEditAll"
              tabindex="0"
              v-model="workflow.description"
              class="form-control form-control-sm"
              placeholder="Description"
            />
            <div title="Workflow description" v-else>{{ workflow.description }}</div>
          </div>
          <div v-if="canReadFinancialSections" title="Workflow subtotal" class="col-12 pl-2 mt-1 font-weight-bold" data-e2e-type="workflow-subtotal">
            {{ subtotal | toCurrency }}
          </div>
          <div class="col-12 mt-1" v-if="isPortalCat && canEditAll">
            <label for="useMt">
              Use MT
              <input type="checkbox" name="useMt" id="useMt" v-model="workflow.useMt" data-e2e-type="use-mt-checkbox">
            </label>
          </div>
        </div>
      </div>
      <!-- task list -->
      <div class="col-10" v-if="!collapsed">
        <workflow-task-detail
          v-for="(task, index) in tasks" :key="task._id || index"
          :load-components="!collapsed && hasAnyVisibleTask[index]"
          :toggled-sections="toggledSections"
          :value="task"
          :can-edit-all="canEditAll"
          :can-edit-workflow="canEditWorkflow"
          :workflow="workflow"
          :original-workflow="originalValue"
          :original-request="originalRequest"
          :companyRates="companyRates"
          :translationUnits="translationUnits"
          :is-following-task-started="isFollowingTaskStarted[index]"
          :is-future-task="isFutureTask[index]"
          :is-foreign-currency-request="isForeignCurrencyRequest"
          :is-previous-provider-task-finished="isPreviousProviderTaskFinished[index]"
          :workflow-id="workflow._id"
          :workflow-task-files-modal-state="workflowTaskFilesModalState"
          :is-portal-cat="isPortalCat"
          :is-user-ip-allowed="isUserIpAllowed"
          :exchangeRate="exchangeRate"
          :task-index="index"
          :scheduling-company="schedulingCompany"
          :requestStatus="request.status"
          :can-read-regulatory-fields-of-workflow="canReadRegulatoryFieldsOfWorkflow"
          @show-analysis-modal="showAnalysisModal"
          :pc-errors="pcErrors"
          :previous-task="previousTask[index]"
          :workflow-language-combination="workflowLanguageCombination"
          @task-in-group-toggle="taskInGroupToggle($event)"
          @input="onTaskUpdate(index, $event)"
          @basic-cat-tool="onBasicCatTool"
          @task-delete="onTaskDelete(index)"
          @task-add="onTaskAdd(index)"
          @task-move="onTaskMove(index, $event)"
          @workflow-totals-update="onWorkflowUpdate"
          @workflow-file-show="onWorkflowFileShow(index, $event)"
          @workflow-note-edit="onWorkflowNoteEdit(index, $event)"
          @workflow-assign-trigger-modal="onWorkflowAssignTriggerModal($event)"
          @workflow-linguistic-task-provider-selected="onWorkflowLinguisticTaskProviderSelected($event)"
          @workflow-reflow-trigger-modal="$emit('workflow-reflow-trigger-modal', $event)"
          @show-confirm-dialog="$emit('show-confirm-dialog', $event)"
          v-bind="wrappedProps"
          v-on="wrappedListeners"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./workflow-detail.scss"></style>
<script src="./workflow-detail.js"></script>

