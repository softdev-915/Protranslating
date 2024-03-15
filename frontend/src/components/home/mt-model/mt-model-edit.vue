<template>
  <div class="pts-grid-edit-modal mt-model-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span>Code</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
            <input
              type="text"
              name="code"
              autofocus
              class="form-control"
              data-e2e-type="mt-model-code"
              v-model.trim="mtModel.code"
            >
          </div>
          <div v-else>{{ mtModel.code }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span>Last trained</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
            <flat-pickr
              :value="localDate"
              @input="onDateChange"
              :config="datepickerOptions"
              data-e2e-type="mt-model-last-trained-at"
              class="form-control" />
          </div>
          <div v-else>{{ mtModel.code }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span>Source Language</div>
          <language-selector
            custom-class="col-12 col-md-10"
            v-if="canCreateOrEdit"
            title="Source language"
            placeholder="Source Language"
            data-e2e-type="mt-model-source-language"
            v-model="mtModel.sourceLanguage"
          />
          <div v-else>{{ mtModel.sourceLanguage }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span>Target Language</div>
          <language-selector
            custom-class="col-12 col-md-10"
            v-if="canCreateOrEdit"
            title="Target language"
            placeholder="Target Language"
            data-e2e-type="mt-model-target-language"
            v-model="mtModel.targetLanguage"
          />
          <div v-else>{{ mtModel.targetLanguage }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span>Industry</span></div>
          <div class="col-12 col-md-10">
            <industry-select
              v-model="mtModel.industry"
              :disabled="!canCreateOrEdit || isGeneralSelected"
              placeholder="Select Industry"
              title="Industry"
              data-e2e-type="mt-model-industry"
            />
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span>Client</span></div>
          <div class="col-12 col-md-10">
            <company-select
              v-if="canCreateOrEdit"
              :selected-option="selectedClient"
              placeholder="Select Company"
              data-e2e-type="mt-model-client"
              :isDisabled="isGeneralSelected"
              @select="onClientSelected"/>
            <input
              v-else
              disabled
              type="text"
              class="form-control"
              :value="selectedClient">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="isGeneral">General</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="isGeneral"
              class="form-control pts-clickable"
              v-model="mtModel.isGeneral"
              data-e2e-type="mt-model-is-general-checkbox"
              :disabled="isGeneralDisabled"
            >
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="deleted">Production Ready</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="isProductionReady"
              class="form-control pts-clickable"
              v-model="mtModel.isProductionReady"
              data-e2e-type="mt-model-is-production-ready-checkbox"
            >
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="deleted">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="deleted"
              class="form-control pts-clickable"
              v-model="mtModel.deleted"
              data-e2e-type="mt-model-deleted-checkbox"
            >
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        data-e2e-type="mt-model-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./mt-model-edit.js"></script>
