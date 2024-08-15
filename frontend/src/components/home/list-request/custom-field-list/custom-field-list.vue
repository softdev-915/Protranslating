<template>
  <div data-e2e-type="custom-fields-list">
    <div class="p-0 col-6 mt-3" v-for="(item, index) in value" :key="index" >
      <label data-e2e-type="custom-field-label">{{ `Custom Text Field ${index + 1}` }}</label>
      <div class="input-group">
        <input
          class="form-control input-field"
          data-e2e-type="custom-field-input"
          type="text"
          v-model="item.value"
          :disabled="isDisabled"
        >
        <div
          class="input-group-addon"
          :class="{'disabled': isDisabled}"
          data-e2e-type="delete-custom-field-button"
          @click="removeCustomField(index)"
        >
          <span class="delete-button material-symbols-outlined">delete</span>
        </div>
      </div>
    </div>
    <div v-if="!isMaxCustomFields && !isDisabled" class="mt-3">
      <button
        class="add-button"
        data-e2e-type="add-custom-field-button"
        @click="addNewCustomField"
      >
        <span class="material-symbols-outlined">add_circle</span>
        Add Custom Field
      </button>
    </div>
  </div>
</template>

<script src="./custom-field-list.js"></script>
<style scoped lang="scss" src="./custom-field-list.scss"></style>

