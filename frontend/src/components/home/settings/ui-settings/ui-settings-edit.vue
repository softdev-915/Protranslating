<template>
  <div class="pts-grid-edit-modal ui-settings-edit" :class="{'blur-loading-row': saving }">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <cat-ui-settings v-model="uiSettings.catUiSettings"></cat-ui-settings>
        </div>
      </div>
    </div>
    <div class="form-actions mt-3 pr-4">
      <button class="btn btn-primary pull-right mr-2" @click="save">Save</button>
    </div>
  </div>
</template>

<script src="./ui-settings-edit.js"></script>