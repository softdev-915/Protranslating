<template>
  <div  data-e2e-type="workflow-main-container" :class="{'red-border': !isValid }" class="col-12 workflow-main-container">
    <workflow-header :toggled-sections="toggledSections" v-model="collapsed"  :foreign-currency="originalRequest.quoteCurrency.isoCode" :show-collapse-icon="showCollapseIcon" />
    <div class="row pl-3" data-e2e-type="workflow">
      <div class="col-2 pl-2 workflow-language-container" :class="{'workflow-container': !collapsed }">
        <div class="row mt-2 mb-2 pl-1 pr-3"  v-if="canEditWorkflow">
          <input class="form-control pts-clickable float-left" type="checkbox" v-if="canEditAll" :disabled="isWorkflowInEditMode" v-model="copyWorkflowSelected" data-e2e-type="workflow-select-checkbox">
          <workflow-detail-buttons
            :is-edit-disabled="isEditDisabled"
            :is-save-disabled="true"
            :is-cancel-disabled="true"
            :show-move-btn="hasMultipleWorkflows"
            :is-move-disabled="isWorkflowInEditMode || !isValidRequest || isRequestCompletedOrDelivered"
            @workflow-edit="$emit('workflow-edit', $event)"
            @workflow-move="moveWorkflow($event)"
          />
        </div>
        <div class="row pl-3 pr-3">
          <div title="Workflow source language" class="read-only-box" data-e2e-type="workflow-source-language-read-only">
            {{ workflowSrcLangName }}
          </div>
        </div>
        <div class="row pl-3 pr-3">
          <div title="Workflow target language" class="read-only-box" data-e2e-type="workflow-target-language-read-only">
            {{ workflowTgtLangName }}
          </div>
        </div>
        <div class="row pl-3 pr-3" v-if="canReadAll">
          <div title="Workflow due date" class="read-only-box" data-e2e-type="workflow-due-date-read-only">
            {{ workflowDueDateReadOnly }}
          </div>
        </div>
        <div class="row pl-3 pr-3">
          <div v-if="canReadAll" class="w-100" title="Workflow description" data-e2e-type="workflow-description">
            <div class="read-only-box">{{ workflow.description }}</div>
          </div>
          <div v-if="canReadFinancialSections" title="Workflow subtotal" class="col-12 pl-2 mt-1 font-weight-bold" data-e2e-type="workflow-subtotal">
            {{ workflow.subtotal | toCurrency }}
          </div>
        </div>
      </div>
      <div class="col-10" v-if="!collapsed">
        <workflow-task-detail-read-only
          :load-components="!collapsed && hasAnyVisibleTask[index]"
          v-for="(task, index) in tasks" :key="task._id || index"
          :toggled-sections="toggledSections"
          :task="task"
          :can-edit-all="canEditAll"
          :is-foreign-currency-request="isForeignCurrencyRequest"
          :task-index="index"
          :is-portal-cat="isPortalCat"
          :workflow-id="workflow._id"
          :request-id="request._id"
          :is-previous-provider-task-finished="isPreviousProviderTaskFinished[index]"
          :previous-task="previousTask[index]"
          :request="request"
          :workflow="workflow"
          :is-user-ip-allowed="isUserIpAllowed"
          :can-read-regulatory-fields-of-workflow="canReadRegulatoryFieldsOfWorkflow"
          :pc-errors="pcErrors"
          />
      </div>
    </div>
  </div>
</template>

<script src="./workflow-detail-read-only.js">
