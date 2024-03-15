<template>
  <div class="pts-grid-edit-modal mt-engines-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2" data-e2e-type="mt-provider-label"><span class="pts-required-field">*</span>MT Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidMtProvider}">
            <basic-select
              class="form-control"
              data-e2e-type="mt-provider-basic-select"
              @select="onMtProviderSelect"
              :selected-option="mtProviderSelected"
              :options="mtProviders"
              :is-disabled="!canCreateOrEdit" />
          </div>
          <div data-e2e-type="mt-provider-readonly" v-else>{{ mtEngine.mtProvider }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2" data-e2e-type="mt-api-key-label"><span class="pts-required-field">*</span>API Key</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidApiKey}">
            <input type="text" class="form-control" data-e2e-type="mt-engine-api-key" v-model.trim="mtEngine.apiKey">
          </div>
          <div data-e2e-type="mt-engine-api-key-readonly" v-else>{{ mtEngine.apiKey }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-1">
            <label for="mt-engine-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-11">
            <input type="checkbox" class="form-control pts-clickable" v-model="mtEngine.deleted" value="true" data-e2e-type="mt-engine-inactive-checkbox" id="mt-engine-inactive">
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions mt-3 pr-4">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="mt-engine-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./mt-engines-edit.js"></script>
