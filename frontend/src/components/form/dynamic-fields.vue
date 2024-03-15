<template>
  <div class="container-fluid p-3">
    <!-- additional properties -->
    <div class="row align-items-center" v-for="prop in allProps" :key="prop" >
      <div class="col-12 col-md-2">{{prop}}</div>
      <div class="col-12 col-md-10 pts-grid-edit-text form-group">
        <div class="input-group">
          <template v-if="additionalSchema[prop].type === 'text'">
            <input type="text" aria-label="Remove property" v-model="additionalValues[prop]" class="form-control">
            <span class="input-group-addon pts-clickable">
              <i class="fas fa-remove" @click="removeProp(prop)"></i>
            </span>
            <span class="input-group-addon pts-clickable editable-icon-group" @click="editProp(prop)">
              <i class="fas fa-pencil editable-type"></i>
              <i class="fas fa-gear editable-config"></i>
            </span>
          </template>
          <template v-else-if="additionalSchema[prop].type === 'number'">
            <input v-bind:data-e2e-type="prop" type="number" aria-label="Number property" v-model="additionalValues[prop]" class="form-control">
            <span class="input-group-addon pts-clickable">
              <i class="fas fa-remove" @click="removeProp(prop)"></i>
            </span>
            <span class="input-group-addon pts-clickable editable-icon-group" @click="editProp(prop)">
              <i class="fas fa-calculator editable-type"></i>
              <i class="fas fa-gear editable-config"></i>
            </span>
          </template>
          <template v-else-if="additionalSchema[prop].type === 'date'">
            <utc-flatpickr v-model="additionalValues[prop]" :config="datepickerOptions" class="pts-match-background form-control"></utc-flatpickr>
            <span class="input-group-addon pts-clickable">
              <i class="fas fa-remove" @click="removeProp(prop)"></i>
            </span>
            <span class="input-group-addon pts-clickable editable-icon-group" @click="editProp(prop)">
                <i class="fas fa-calendar editable-type"></i>
                <i class="fas fa-gear editable-config"></i>
            </span>
          </template>
        </div>
      </div>
    </div>
    <!-- add new property button -->
    <div class="row justify-content-end" v-show="!showNewPropertyEdit">
      <div class="col-12 col-md-2">
        <button @click="showAddProperty" class="btn btn-secondary w-100">Add new property</button>
      </div>
    </div>
    <!-- add new property form -->
    <div class="row align-items-center" v-show="showNewPropertyEdit">
      <div class="col-12 pl-3 form-group">
        <label for="name">Name</label>
        <input type="text" class="form-control" v-model.trim="newName">
      </div>
      <div class="col-12 pl-3 form-group">
        <label for="type">Type</label>
        <simple-basic-select
          id="type"
          v-model="newType"
          class="form-control non-focusable"
          :options="newTypeSelectOptions"
          :format-option="formatNewTypeSelectOption"/>
      </div>
      <div class="col-12 col-md-2 form-actions">
        <button @click="addProperty" class="btn btn-primary" :disabled="!isValidNewProp">{{addText}}</button>
        <button @click="cancelProperty" class="btn btn-secondary" >Cancel</button>
      </div>
    </div>
  </div>
</template>

<script src="./dynamic-fields.js"></script>

<style scoped src="./dynamic-fields.scss"></style>
