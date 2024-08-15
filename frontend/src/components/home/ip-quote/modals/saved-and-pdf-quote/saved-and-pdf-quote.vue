<template>
  <ip-modal width="500px" height="355px" v-model="isShow" :closeIcon="false">
    <template slot="header">
      <span data-e2e-type="ip-modal-title">Quote Saved and Downloaded!</span>
    </template>
    <div class="ip-modal-body">
      <i
        class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success"
      />
      <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">Quote downloaded successfully!</div>
      <div class="ip-modal-body__request">
        <span>Your Request Number is: </span>
        <router-link
          tag="span"
          data-e2e-type="success-save-and-download-pdf-request-number"
          class="ip-modal-body__link"
          :to="{
            name: 'quote-quote-detail',
            params: { requestId: this.requestId },
          }"
          >{{ requestNumber }}</router-link
        >
      </div>
      <ip-button
        class="ip-modal-body__close mt-4"
        @click.native="onClose"
        type="filled"
        >Close</ip-button
      >
    </div>
  </ip-modal>
</template>

<style lang="scss" src="./../modals.scss"></style>
<script src="./saved-and-pdf-quote.js"></script>
