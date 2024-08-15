<template>
  <div class="row align-items-center" v-if="isContact || isVendor">
    <div class="col-12 col-md-2">{{ labelText }}</div>
    <div v-if="isContact && !readOnly" class="col-12 col-md-7">
      <simple-basic-select
        v-model="status"
        :options="contactStatusSelectOptions"
        title="Contact status selector"
        data-e2e-type="contact-status-selector"
      />
    </div>
    <div v-if="isVendor && !readOnly" class="col-12 col-md-8">
      <simple-basic-select
        v-model="status"
        :options="vendorStatusSelectOptions"
        data-e2e-type="vendor-status-selector"
        :title="'Vendor status selector'"
      />
    </div>
    <div v-if="readOnly" class="col-12 col-md-10">
      {{ status }}
    </div>
  </div>
</template>

<script src="./user-status-details.js"></script>
