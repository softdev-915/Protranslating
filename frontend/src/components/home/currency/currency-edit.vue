<template>
  <div class="pts-grid-edit-modal currency-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canSaveForm">*</span> Name</div>
          <div class="col-12 col-md-10" v-if="canSaveForm">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="currency-name" v-model.trim="currency.name">
          </div>
          <div  data-e2e-type="currency-name-read-only"  v-else>{{ currency.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canSaveForm">*</span> ISO Code</div>
          <div class="col-12 col-md-10" v-if="canSaveForm">
            <input type="text" name="isoCode" autofocus class="form-control" data-e2e-type="currency-iso-code" v-model.trim="currency.isoCode">
          </div>
          <div data-e2e-type="currency-iso-code-read-only" v-else>{{ currency.isoCode }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field"></span> Symbol </div>
          <div class="col-12 col-md-10" v-if="canSaveForm">
            <input type="text" name="symbol" autofocus class="form-control" data-e2e-type="currency-symbol" v-model.trim="currency.symbol">
          </div>
          <div v-else>{{ currency.symbol }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-if="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="currency-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="currency-inactive" class="form-control pts-clickable" v-model="currency.deleted" value="true"  data-e2e-type="currency-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="currency-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canSaveForm">Save</button>
    </div>
  </div>
</template>

<script src="./currency-edit.js"></script>
