<template>
  <div>
    <b-modal size="lg" hide-header-close ref="modal" data-e2e-type="scheduler-modal" class="scheduler-modal" :closeOnBackdrop="false" @close="hideModal()">
      <div slot="modal-header" class="w-100">
        <h6>Select the target entity</h6>
      </div>
      <div slot="default">
        <div class="row mb-2">
          <div class="col-12">
            <label class="pts-font-bold required" for="entitySelect">Entity</label>
            <simple-basic-select
              id="entitySelect"
              data-e2e-type="scheduler-entity-select"
              v-model="selectedEntity"
              :options="filteredEntities"
              title="Entity"/>
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='Company'">
          <div class="col-12">
            <label class="pts-font-bold" for="companySelect">Company</label>
            <company-ajax-basic-select
              id="companySelect"
              data-e2e-type="scheduler-entity-value-select"
              :selected-option="selectedEntityValue"
              :filter="filter"
              :fetch-on-created="false"
              :select="'_id name'"
              @select="onOptionSelect"
            />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='ArAdvance'">
          <div class="col-12">
            <label class="pts-font-bold" for="arAdjustmentSelect">Ar Advance</label>
            <ar-advance-select
              id="arAdjustmentSelect"
              v-model="selectedEntityValue"
              placeholder="Ar Advance"
              title="Ar Advance"
              data-e2e-type="scheduler-entity-value-select"
              @select="onOptionSelect"
              :fetch-on-created="false"
              :filter="filter" />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='User'">
          <div class="col-12">
            <label class="pts-font-bold" for="userSelect">User</label>
            <user-ajax-basic-select
              data-e2e-type="scheduler-entity-value-select"
              id="userSelect"
              :selected-option="selectedEntityValue"
              :filter="userFilter"
              @select="onOptionSelect"
              title="User list">
            </user-ajax-basic-select>
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='Bill'">
          <div class="col-12">
            <label class="pts-font-bold" for="billSelect">Bill</label>
            <bill-ajax-select
              id="bill-select"
              v-model="selectedEntityValue"
              placeholder="Bill Number"
              title="Bill Number"
              data-e2e-type="scheduler-entity-value-select"
              :fetch-on-created="false"
              @input="onOptionSelect"
              :filter="filter"
            />
          </div>
        </div>
        <div class="row" v-if="selectedEntity === 'Invoice'">
          <div class="col-12">
            <label class="pts-font-bold" for="invoice-select">Invoice Number</label>
            <invoice-ajax-select
              id="invoice-select"
              v-model="selectedEntityValue"
              placeholder="Invoice Number"
              title="Invoice Number"
              data-e2e-type="scheduler-entity-value-select"
              :fetch-on-created="false"
              :filter="filter"
              @select="onOptionSelect" />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='ArAdjustment'">
          <div class="col-12">
            <label class="pts-font-bold" for="arAdjustmentSelect">Ar Adjustment</label>
            <ar-adjustment-select
              id="arAdjustmentSelect"
              v-model="selectedEntityValue"
              placeholder="Ar Adjustment"
              title="Ar Adjustment"
              data-e2e-type="scheduler-entity-value-select"
              @select="onOptionSelect"
              :fetch-on-created="false"
              :filter="filter" />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='BillAdjustment'">
          <div class="col-12">
            <label class="pts-font-bold" for="billAdjustmentSelect">Bill Adjustment</label>
            <bill-adjustment-select
              id="billAdjustmentSelect"
              v-model="selectedEntityValue"
              placeholder="Bill Adjustment"
              title="Bill Adjustment"
              data-e2e-type="scheduler-entity-value-select"
              @select="onOptionSelect"
              :fetch-on-created="false"
              :filter="filter" />
          </div>
        </div>
        <div class="row" v-if="selectedEntity === 'AutoTranslateRequest'">
          <div class="col-12">
            <label class="pts-font-bold" for="autoRequestSelector">Auto Workflow Request</label>
            <request-selector
              id="autoRequestSelector"
              data-e2e-type="scheduler-entity-value-select"
              v-model="selectedEntityValue"
              @input="onOptionSelect"
              :filter="{ workflowType: 'Auto Scan PDF to MT Text', status: 'To be processed' }"
              :fetch-on-created="false"
              :select="'_id no'"
            />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='ApPayment'">
          <div class="col-12">
            <label class="pts-font-bold" for="apPaymentSelect">AP Payment</label>
            <ap-payment-ajax-select
              id="apPaymentSelect"
              v-model="selectedEntityValue"
              placeholder="AP Payment"
              title="AP Payment"
              data-e2e-type="scheduler-entity-value-select"
              @select="onOptionSelect"
              :fetch-on-created="false"
              :filter="filter" />
          </div>
        </div>
        <div class="row" v-if="selectedEntity ==='ArPayment'">
          <div class="col-12">
            <label class="pts-font-bold" for="arPaymentSelect">AR Payment</label>
            <ar-payment-ajax-select
              id="apPaymentSelect"
              v-model="selectedEntityValue"
              placeholder="AP Payment"
              title="AP Payment"
              data-e2e-type="scheduler-entity-value-select"
              @select="onOptionSelect"
              :fetch-on-created="false"
              :filter="filter" />
          </div>
        </div>
      </div>
      <div slot="modal-footer">
        <button
          v-if="canShowMockedEntityPayload"
          class="btn mr-1 btn-info"
          data-e2e-type="mocked-entity-payload-button"
          @click="populateMockedEntitySIPayload"
        >
          Populate mocked entity SI Payload
        </button>
        <button
          class="btn mr-1 btn-primary"
          data-e2e-type="modal-run-now-button"
          @click="runNow"
          :disabled="wasEntitySelected">
          Process {{ !selectedEntityValue.text ? 'all records' : selectedEntityValue.text}}
        </button>
        <button class="btn btn-secondary" data-e2e-type="modal-close-button" @click="hideModal">
          Close
        </button>
      </div>
    </b-modal>
  </div>
</template>
<script src="./scheduler-entity-modal.js"></script>
