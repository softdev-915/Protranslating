<template>
  <div class="pts-grid-edit-modal" :class="{'blur-loading-row': httpRequesting }" data-e2e-type="companyMinimumCharge-edit-container">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12" :class="{'has-danger': !isValidCompany}" data-e2e-type="company-container">
            <label class="d-block"><span v-if="canCreateOrEdit" class="pts-required-field">*</span> Company</label>
            <company-ajax-basic-select
              v-if="canCreateOrEdit"
              data-e2e-type="company-select"
              :selected-option="selectedCompany"
              :fetch-on-created="false"
              placeholder="Select Company"
              :select="'_id name parentCompany'"
              @select="onSelectedCompany" />
            <div v-else> {{ companyMinimumCharge.company.hierarchy }}</div>
          </div>
        </div>
        <div class="row align-items-center" v-if="canCreateOrEdit">
          <div class="col-12" data-e2e-type="ability-container" :class="{'has-danger': !isValidMinCharge }">
            <label for="ability" class="d-block"><span class="pts-required-field">*</span> Ability</label>
            <simple-basic-select
              v-if="canCreateOrEdit"
              v-model="abilitySelected"
              placeholder="Ability"
              data-e2e-type="ability-select"
              :mandatory="true"
              @select="onSelectedAbility"
              :format-option="formatAbilitySelectedOption"
              :empty-option="emptyAbilitySelectedOption"
              :options="abilities"/>
            <div v-else> {{ companyMinimumCharge.ability.name }}</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12">
            <label for="languageCombinations" class="d-block">Languages</label>
          </div>
          <div class="col-12 multiselect-container" data-e2e-type="languageCombinations-container">
            <language-combination-selector
              v-if="canCreateOrEdit"
              id="languageCombinations"
              placeholder="Select the language combinations"
              title="Language list"
              data-e2e-type="language-combination-selector"
              :isDisabled="!canCreateOrEdit"
              :max-selected="1"
              v-model="companyMinimumCharge.languageCombinations"/>
            <div v-else> {{ languageCombinations }}</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12">
            <label for="minCharge" class="d-block"><span v-if="canCreateOrEdit" class="pts-required-field">*</span> Min Charge</label>
          </div>
          <div class="col-12" data-e2e-type="min-charge-input-container" :class="{'has-danger': !isValidMinCharge }">
            <currency-input
              id="minCharge"
              title="Min charge"
              :class="{'disabled-v-money': !canEdit }"
              :disabled="!canEdit"
              :precision="2"
              :currency="null"
              v-model="companyMinimumCharge.minCharge"
              aria-label="Min charge"
              class="form-control form-control-sm"
              data-e2e-type="min-charge-input"
              placeholder="Min charge" />
          </div>
        </div>
        <div class="row alingn-items-center">
          <div class="col-12">
            <label for="minChangeCurrency"><span v-if="canCreateOrEdit" class="pts-required-field">*</span>Currency</label>
          </div>
          <div class="col-12" data-e2e-type="min-charge-currency-container" :class="{'has-danger': !isValidCurrency }">
            <currency-selector
              id="minChangeCurrency"
              title="Min charge currency"
              v-model="companyMinimumCharge.currency"
              :fetch-on-created="false"
              :disabled="!canCreateOrEdit"
              :currenciesAvailable="currencies"
              :format-option="currencyFormatter"
              data-e2e-type="companyMinimumCharge-currency-select"/>
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canCreateOrEdit">
          <div class="col-1 col-md-2">
            <label for="deleted" class="pt-2">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              id="deleted"
              type="checkbox"
              class="form-control pts-clickable"
              v-model="companyMinimumCharge.deleted"
              data-e2e-type="companyMinimumCharge-inactive">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button
        v-if="canCreateOrEdit"
        v-show="!httpRequesting"
        @click="cloneRecord"
        class="btn btn-seconday pull-right mr-2"
        data-e2e-type="companyMinimumCharge-clone">Clone</button>
      <button
        :disabled="!isValid"
        v-if="canCreateOrEdit"
        v-show="!httpRequesting"
        @click="validateBeforeSubmit"
        class="btn btn-primary pull-right mr-2"
        data-e2e-type="companyMinimumCharge-save">Save</button>
    </div>
  </div>
</template>

<script src="./company-minimum-charge-edit.js"></script>
