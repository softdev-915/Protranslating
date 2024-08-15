<template>
  <div class="pts-grid-edit-modal" :class="{'blur-loading-row': httpRequesting || countriesLoading || statesLoading }" data-e2e-type="location-edit-container">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              Name <span class="pts-required-field">*</span>
            </label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
            <input
              type="text"
              id="name"
              name="name"
              class="form-control"
              v-model="location.name"
              v-validate="'required'"
              :class="{'form-control-danger': errors.has('name')}"
              data-e2e-type="location-name">
            <div class="form-control-feedback" v-show="errors.has('name')">Location name is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{location.name}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><label for="address">Address</label></div>
          <div class="col-12 col-md-10">
            <input
              v-if="canCreateOrEdit"
              id="address"
              data-e2e-type="address"
              type="text"
              class="form-control"
              name="address"
              v-model.trim="location.address">
            <span v-else>{{ location.address }}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><label for="suite">Suite#</label></div>
          <div class="col-12 col-md-10">
            <input
              v-if="canCreateOrEdit"
              id="suite"
              data-e2e-type="suite"
              type="text"
              class="form-control"
              name="suite"
              v-model="location.suite">
            <span v-else>{{ location.suite }}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-7 col-md-2"><label for="city">City</label></div>
          <div class="col-7 col-md-5">
            <input
              v-if="canCreateOrEdit"
              id="city"
              data-e2e-type="city"
              type="text"
              class="form-control"
              name="city"
              v-model.trim="location.city">
            <span v-else>{{ location.city }}</span>
          </div>
          <div class="col-5 col-md-1"><label for="stateSelector">State</label></div>
          <div class="col-5 col-md-4">
            <basic-select
              v-if="canCreateOrEdit"
              id="stateSelector"
              :options="stateOptions"
              :selected-option="selectedState"
              placeholder="Select State"
              title="State"
              data-e2e-type="stateSelector"
              :class="{'blur-loading-row': countriesLoading || statesLoading}"
              @select="onStateSelected">
            </basic-select>
            <span v-else>{{ selectedState ? selectedState.name : '' }}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-7 col-md-2">Country</div>
          <div class="col-7 col-md-5">
            <country-selector
              v-if="canCreateOrEdit"
              v-model="location.country"
              :available-countries="countries"
              placeholder="Select Country"
              title="Country"
              data-e2e-type="countrySelector"
              @select="onCountrySelected"
              :class="{'blur-loading-row': countriesLoading || statesLoading}"
              :availableCountries="countries"
              :default-name="defaultCountryName">
            </country-selector>
            <span v-else>{{ (location.country && location.country.name) || '' }}</span>
          </div>
          <div class="col-5 col-md-1"><label for="zip">Zip</label></div>
          <div class="col-5 col-md-4">
            <input
              v-if="canCreateOrEdit"
              id="zip"
              data-e2e-type="location-zip"
              type="text"
              class="form-control"
              name="zip"
              v-model.trim="location.zip">
            <span v-else>{{ location.zip }}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><label for="phone">Phone</label></div>
          <div class="col-12 col-md-10">
            <input
              v-if="canCreateOrEdit"
              id="phone"
              name="phone"
              data-e2e-type="phone"
              type="text"
              class="form-control"
              v-model="location.phone">
            <span v-else>{{ location.phone }}</span>
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="deleted">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              id="deleted"
              type="checkbox"
              class="form-control pts-clickable"
              v-model="location.deleted"
              data-e2e-type="location-inactive">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button
        :disabled="!isValid"
        v-if="canCreateOrEdit"
        v-show="!httpRequesting"
        @click="validateBeforeSubmit"
        class="btn btn-primary pull-right mr-2"
        data-e2e-type="location-save">Save</button>
    </div>
  </div>
</template>

<script src="./location-edit.js"></script>
