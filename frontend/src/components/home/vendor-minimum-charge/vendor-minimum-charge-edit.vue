<template>
  <div
    class="pts-grid-edit-modal vendor-minimum-charge-inline-edit"
    :class="{'blur-loading-row': httpRequesting}"
  >
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span class="pts-required-field">*</span>
            Vendor
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': errors.has('vendor')}">
            <user-ajax-basic-select
                :selected-option="selectedVendor"
                @select="onVendorSelect"
                data-e2e-type="vendor-minimum-charge-vendor-select"
                placeholder="Vendor Name">
              </user-ajax-basic-select>
          </div>
          <div v-else>{{ selectedVendor.text }}</div>
        </div>
        <div class="row align-items-center" data-e2e-type="ability-container">
          <div class="col-12 col-md-2">
            <label for="ability" class="d-block">
              <span v-if="canCreateOrEdit" class="pts-required-field">*</span> Ability
            </label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': !isValidAbility}">
            <simple-basic-select
              v-if="canCreateOrEdit"
              :value="vendorMinimumCharge.ability"
              @select="onAbilitySelect"
              @delete="onAbilityDelete"
              placeholder="Ability"
              :format-option="formatAbilityOption"
              data-e2e-type="vendor-minimum-charge-ability"
              :options="abilities"
            />
            <div v-else> {{ vendorMinimumCharge.ability.name }}</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            Language Combinations
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
             <language-combination-selector
              id="languageCombinations"
              :max-selected="1"
              title="Language list"
              data-e2e-type="vendor-minimum-charge-language-combinations"
              v-model="vendorMinimumCharge.languageCombinations"/>
          </div>
          <div v-else>{{ vendorMinimumCharge.languageCombinationsText }}</div>
        </div>

        <div class="row align-items-center">
          <div class="col-11 col-md-2">
            <label for="vendor-minimum-charge-rate">
              <span class="pts-required-field">*</span>
              Minimum Charge Rate
            </label>
          </div>
          <div id="vendor-minimum-charge-rate" class="col-12 col-md-10" :class="{'has-danger': !isValidRate}">
            <currency-input
              class="form-control form-control-sm"
              v-model="vendorMinimumCharge.rate"
              :currency="null"
              data-e2e-type="vendor-minimum-charge-rate"
              placeholder="Rate">
          </currency-input>
            <span v-show="!isValidRate" data-e2e-type="vendor-minimum-charge-rate-error">
              Enter number higher than 0.00
            </span>
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="vendor-minimum-charge-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="vendor-minimum-charge-inactive"
              class="form-control pts-clickable"
              v-model="vendorMinimumCharge.deleted"
              value="true"
              data-e2e-type="vendor-minimum-charge-inactive-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        v-if="canCreateOrEdit"
        v-show="!httpRequesting"
        @click="cloneRecord"
        class="btn btn-seconday pull-right mr-2"
        data-e2e-type="vendor-minimum-charge-clone">Clone</button>
      <button
        data-e2e-type="vendor-minimum-charge-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./vendor-minimum-charge-edit.js"></script>
