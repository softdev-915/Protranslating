<template>
  <ip-modal width="468px" v-model="isOpened" v-if="isOpened">
    <template slot="header">
      <span data-e2e-type="ip-modal-title">Discard quote</span>
    </template>
    <div class="ip-modal-body">
        <i
          class="fas fa-times-circle ip-modal-body-icon ip-modal-body-icon__warning"
        />
        <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">
          Discard unsaved quote changes!
        </div>
        <div class="ip-modal-body__controls w-100">
          <ip-button class="mr-4" @click.native="isOpened=false" data-e2e-type="discard-cancel"> Cancel </ip-button>
          <ip-button type="filled" @click.native="onDiscard" data-e2e-type="discard-approve"> Discard </ip-button>
        </div>
      </div>
  </ip-modal>
</template>
<script src="./discard-quote.js"> </script>
