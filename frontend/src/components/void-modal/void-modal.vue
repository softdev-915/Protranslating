<template>
  <div>
    <button
      data-e2e-type="void-button"
      class="btn btn-danger pull-right mr-2" @click="show">Void</button>
    <b-modal hide-header-close ref="modal" class="void-modal" data-e2e-type="void-modal" :closeOnBackdrop="false" size="lg">
      <h5 slot="modal-header">{{ title }}</h5>
      <div slot="default" class="container-fluid" v-if="!isConfirming">
        <dl class="pl-2">
          <template v-for="[field, value] in Object.entries(details)">
            <dt :key="`field-${field}`">{{ field }}</dt>
            <dd :key="field" :data-e2e-type="`void-modal-readonly-${field}`">{{ value }}</dd>
          </template>
        </dl>
        <div class="row align-items-center">
          <div class="col-12">
            Reverse the transaction on date<span class="pts-required-field">*</span>
          </div>

          <div class="col-6" :class="{'has-danger': !isValidDate}" data-e2e-type="reverse-transaction-on-date-container" >
            <utc-flatpickr
              :config="datepickerOptions"
              data-e2e-type="reverse-transaction-on-date"
              v-model="date"
              class="form-control"
              name="date" />
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12">Memo</div>
          <div class="col-6">
            <input data-e2e-type="memo" class="form-control" type="text" v-model="memo">
          </div>
        </div>
      </div>
      <div slot="default" class="container-fluid" data-e2e-type="void-confirm-message" v-else>
        You are about to void a transaction. This action is irreversible. Would you like to continue?
      </div>
      <div slot="modal-footer">
        <button data-e2e-type="void-button-submit" class="btn mr-1 btn-danger" type="button" :disabled="!isValid" @click="submit">
          {{ submitBtnTitle }}
        </button>
        <button data-e2e-type="void-button-cancel" class="btn btn-secondary" type="button" @click="cancel">
          {{ cancelBtnTitle }}
        </button>
      </div>
    </b-modal>
  </div>
</template>

<script src="./void-modal.js"></script>
<style lang="scss" src="./void-modal.scss"></style>
