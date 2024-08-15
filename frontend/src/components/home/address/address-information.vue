<template>
  <div class="container-fluid p-0" :class="{'blur-loading-row': countriesLoading}">
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <label :for="`${addressType}-address1`">Address 1</label>
        <span v-if="required" class="pts-required-field" data-e2e-type="address-line1-required">*</span>
      </div>
      <div class="col-12 col-md-10">
        <input
          :id="`${addressType}-address1`"
          :disabled="disabled"
          data-e2e-type="addressLine1"
          type="text"
          class="form-control"
          name="line1"
          v-model.trim="addressInfo.line1">
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <label :for="`${addressType}-address2`">Address 2</label>
      </div>
      <div class="col-12 col-md-10">
        <input
          :id="`${addressType}-address2`"
          :disabled="disabled"
          data-e2e-type="addressLine2"
          type="text"
          class="form-control"
          name="line2"
          v-model.trim="addressInfo.line2">
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-4 col-md-2"><label :for="`${addressType}-city`">City</label> <span v-if="required" class="pts-required-field" data-e2e-type="address-city-required">*</span></div>
      <div class="col-4 col-md-3" v-if="!disabled">
        <input
          :id="`${addressType}-city`"
          data-e2e-type="addressCity"
          type="text"
          class="form-control"
          name="city"
          v-model.trim="addressInfo.city">
      </div>
      <div class="col-4 col-md-1" v-else>{{addressInfo.city}}</div>
      <div class="col-4 col-md-1">State </div>
      <div class="col-4 col-md-3" v-if="!disabled">
        <basic-select
          :id="`${addressType}-stateSelector`"
          :options="stateOptions"
          :selected-option="selectedState"
          placeholder="Select State"
          title="State"
          data-e2e-type="stateSelector"
          :class="{'blur-loading-row': countriesLoading || statesLoading}"
          @select="onStateSelected"/>
      </div>
      <div class="col-4 col-md-3" v-else>{{ state ? state.name : ''}}</div>
      <div class="col-4 col-md-1"><label :for="`${addressType}-zip`">Zip</label> <span v-if="required" class="pts-required-field" data-e2e-type="address-zip-required">*</span></div>
      <div class="col-4 col-md-2" v-if="!disabled">
        <input
          :for="`${addressType}-zip`"
          data-e2e-type="addressZip"
          type="text"
          class="form-control"
          name="zip"
          v-model.trim="addressInfo.zip">
      </div>
      <div class="col-4 col-md-2" v-else>{{addressInfo.zip}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-7 col-md-2">
        Country
        <span v-if="required" class="pts-required-field" data-e2e-type="address-country-required">*</span>
      </div>
      <div class="col-7 col-md-5" v-if="!disabled">
        <country-selector
          v-model="addressInfo.country"
          :available-countries="countries"
          :is-disabled="disabled"
          :class="{'blur-loading-row': countriesLoading || statesLoading}"
          :default-name="defaultCountryName"
          placeholder="Select Country"
          title="Country"
          data-e2e-type="countrySelector"
          @select="onCountrySelected"/>
      </div>
      <div class="col-5 col-md-5" v-else>{{country && country.name ? country.name : '' }}</div>
      <div class="col-5 col-md-2">Country Code </div>
      <div class="col-5 col-md-3" data-e2e-type="country-code">
        <span>{{countryCode}}</span>
      </div>
    </div>
  </div>
</template>

<script src="./address-information.js"></script>
