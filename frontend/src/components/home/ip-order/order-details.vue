<template>
  <div>
    <h4 class="body__header">Order Details</h4>
    <p class="body__text">
      Enter the order information below
    </p>
    <div class="row mt-4">
      <div class="col-6">
        <ip-contact-select 
          v-model="details.alsoDeliverTo"
          :companyId="companyId"
          placeholder="Also deliver to"
          data-e2e-type="also-deliver-to"
          :filter="contactFilter"
          />
      </div>
      <div class="col-6">
        <ip-input
          type="text"
          placeholder="Other CC"
          data-e2e-type="other-cc"
          v-model="details.otherCC"
          :isValueValid="isValidOtherCC"
        />
      </div>
    </div>
    <ip-input
      class="ip-modal-body__textarea mt-4 w-100"
      placeholder="Instructions and comments"
      data-e2e-type="instruction-and-comments"
      v-model="details.instructionsAndComments"
    />
    <div class="body__header mt-4">
      Files
    </div>
    <ip-file-upload @file-upload="onFilesUpload" :required="filesRequired && required" class="mt-4"/>
  </div>
</template>
<script src='./order-details.js'> </script>
<style scoped lang="scss" src="../ip-quote/create.scss"></style>
<style lang="scss" scoped src="../ip-quote/epo-create.scss"></style>