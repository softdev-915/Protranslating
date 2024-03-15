<template>
  <div class="pts-grid-edit-modal ability-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">Name</label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
            <input
              type="text"
              data-e2e-type="name-input"
              id="name"
              name="name"
              class="form-control"
              :class="{'form-control-danger': errors.has('name')}"
              :readonly="system"
              v-model="ability.name"
              v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')">Ability name is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{ability.name}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="description">Description</label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
            <input type="text" data-e2e-type="description-input" id="description" name="description" class="form-control" v-model="ability.description">
          </div>
          <div class="col-12 col-md-10" v-else>
            {{ ability.description }}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label class="required" for="gl-account-no">Revenue GL Account Number</label>
          </div>
          <div class="col-12 col-md-10" v-if="hasRole('ABILITY-ACCT_UPDATE_ALL')">
            <simple-basic-select
              data-e2e-type="gl-account-no-select"
              :options="revenueAccountsPromise"
              :mandatory="true"
              :formatOption="formatRevenueAccountItem"
              v-model="ability.glAccountNo"/>
          </div>
          <div class="col-12 col-md-10" data-e2e-type="gl-account-no-readonly" v-else>
            {{ ability.glAccountNo }}
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="system">
              System
            </label>
          </div>
          <div class="col-1 col-md-10">
           <input
            id="system"
            data-e2e-type="system-checkbox"
            :disabled="true"
            type="checkbox"
            class="form-control pts-clickable"
            v-model="system"
            :value="system">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="languageCombination">
              Language Combination required
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input id="languageCombination" data-e2e-type="language-combination-checkbox" :disabled="!canCreateOrEdit" type="checkbox" class="form-control pts-clickable" v-model="ability.languageCombination" value="true">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="catTool">
              Translation Tool required
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input id="catTool" data-e2e-type="cat-tool-checkbox" type="checkbox" :disabled="!canCreateOrEdit" class="form-control pts-clickable" v-model="ability.catTool" value="true">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="competenceLevel">
              Competence Level Required
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input id="competenceLevel" data-e2e-type="competence-level-checkbox" :disabled="!canCreateOrEdit" type="checkbox" class="form-control pts-clickable" v-model="ability.competenceLevelRequired" value="true">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="internalDepartment">
              Internal department Required
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input id="internalDepartment" data-e2e-type="internal-department-checkbox" :disabled="!canCreateOrEdit" type="checkbox" class="form-control pts-clickable" v-model="ability.internalDepartmentRequired" value="true">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="company">
              Company Required
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input id="company" data-e2e-type="company-checkbox" :disabled="!canCreateOrEdit" type="checkbox" class="form-control pts-clickable" v-model="ability.companyRequired" value="true">
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="deleted">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              id="deleted"
              data-e2e-type="ability-inactive"
              type="checkbox"
              class="form-control pts-clickable"
              v-model="ability.deleted"
              value="true">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button @click="save" data-e2e-type="ability-save" class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./ability-edit.js"></script>
