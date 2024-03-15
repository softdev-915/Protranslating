<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12 col-md-6">
        <subnet-input
          :disabled="disabled"
          v-model="ip"
          @subnet-valid="valid = $event">
        </subnet-input>
      </div>
      <div class="col-12 col-md-6">
        <div
          class="form-group p-0 m-0"
          :class="{ 'has-danger': !isDescriptionValid }">
          <input
            :disabled="disabled"
            data-e2e-type="subnet-group-description"
            type="text"
            v-model.trim="description"
            class="form-control"
            placeholder="Subnet description"
            aria-label="Subnet description" />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./subnet-group.js"></script>
