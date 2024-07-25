<template>
  <b-modal size="lg" hide-header-close :class="containerClass" :data-e2e-type="dataE2eType" ref="confirm" @close="cancel()">
    <h5 slot="modal-title" v-if="confirmationTitle">
      {{confirmationTitle}}
    </h5>
    <div slot="default">
      <h6 data-e2e-type="confirm-dialog-message" class="confirm-dialog-message">
        {{confirmationMessage}}
      </h6>
    </div>
    <div slot="modal-footer" class="form-actions container pl-1 pr-1" :class="{'text-right': !showRememberOption }">
      <div class="row" v-if="showRememberOption">
        <div class="col-9 pl-0 pt-2 text-left">
          <span class="pl-4">Don't show this dialog again</span>
          <input type="checkbox" v-model="storedResponse">
        </div>
        <div class="col-3 text-right">
          <button class="btn" :class="cancelBtnClass" type="button" data-e2e-type="cancel" @click="cancel()">
            {{ cancelText }}
          </button>
          <button class="btn" :class="confirmBtnClass" type="button" data-e2e-type="confirm" @click="confirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
      <div v-else>
        <button class="btn mr-1" :class="cancelBtnClass" type="button" data-e2e-type="cancel" @click="cancel()">
          {{ cancelText }}
        </button>
        <button class="btn" :class="confirmBtnClass" type="button" data-e2e-type="confirm" @click="confirm()">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script src="./confirm-dialog.js"></script>
<style src="./confirm-dialog.scss"></style>
