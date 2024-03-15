<template>
  <ip-modal width="600px" marginTop="164px" v-model="isOpened" v-if="isOpened">
    <template slot="header">
      <span data-e2e-type="ip-modal-title">Quote Approved!</span>
    </template>
    <div class="ip-modal-body approve-modal-body">
      <i
        class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success"
      />
      <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">Quote approved successfully!</div>
      <div class="ip-modal-body__request">
        <span>Your Request Number is: </span>
        <router-link
          v-if="request && request._id"
          tag="a"
          :to="{name:'request-edition', params: {requestId: request._id}}"
          title="Contact Us">
          <span data-e2e-type="request-number">{{ request.no }}</span>
        </router-link>
      </div>
      <div v-if="canEditQuote" class="w-100">
        <div class="ip-modal-body__subheader mt-4 w-100 text-left">
          Complete your order entering the fields below!
        </div>
        <ip-input
          class="ip-modal-body__textarea mt-4 w-100"
          placeholder="Instructions and comments"
          v-model="instructionsAndComments"
          data-e2e-type="ip-instructions-and-comments"
        />
        <div class="ip-modal-body__subheader mt-4 w-100 text-left">
          Files
        </div>
        <ip-file-upload @file-upload="onFilesUpload" class="mt-4"/>
      </div>
      <div class="ip-modal-body__controls w-100">
        <ip-button class="mr-4" @click.native="isOpened = false">Cancel</ip-button>
        <ip-button type="filled" :disabled="loading" @click.native="saveAndSeeQuote" data-e2e-type="see-order">{{ approveButtonText }}</ip-button>
      </div>
    </div>
  </ip-modal>
</template>

<script src="./approve-quote.js"></script>
