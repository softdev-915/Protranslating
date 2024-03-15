<template>
  <ip-modal width="500px" height="380px" v-model="isShow">
    <template slot="header">
      <span data-e2e-type="ip-modal-title">{{ modalTitle }}</span>
    </template>
    <div class="ip-modal-body">
      <i
        class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success"
      />
      <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">
        {{ modalDescription }}
      </div>
      <div class="ip-modal-body__request">
        <span>Your Request Number is: </span>
        <a
          tag="span"
          data-e2e-type="request-number"
          class="ip-modal-body__link"
          href="#"
          @click="onQuoteDetailEnter"
        >
          {{ requestNumber }}
        </a>
      </div>
      <div
        class="ip-button mt-4"
        data-e2e-type="enter-quote-detail-button"
        @click="onQuoteDetailEnter"
      >
        See your {{ ipType.toLowerCase() }}
      </div>
    </div>
  </ip-modal>
</template>

<style lang="scss" src="./../modals.scss"></style>
<script src="./saved-quote.js"></script>
