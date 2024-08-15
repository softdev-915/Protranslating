<template>
  <div class="pts-grid-edit-modal groups-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid" v-show="!managingRoles">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10">
            <input type="text" class="form-control" data-e2e-type="group-name" :class="{'form-control-danger': !isValidName}" v-model.trim="group.name">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Roles</div>
          <div class="col-8 col-md-8 pts-grid-edit-text">
            {{group.roles.join(', ')}}
          </div>
          <div class="col-4 col-md-2 mobile-align-right" v-if="canEdit">
            <i class="fas fa-spin fa-circle-o-notch" v-show="loadingRoles"></i>
            <button data-e2e-type="manageRoles" class="btn btn-primary" v-show="!loadingRoles" @click="manageRole">Manage</button>
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label>Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" class="form-control pts-clickable" v-model.trim="group.deleted" value="true" >
          </div>
        </div>
      </div>
      <!-- ROLE MANAGEMENT -->
      <div class="container-fluid" v-show="managingRoles">
        <div class="row align-items-center" id="groupsRolesList">
          <div class="col-12 col-md-4 checkbox-modal-window" data-e2e-type="group-role-list" v-for="role in roles">
            <label class="pts-clickable"><input type="checkbox" v-model="group.roles" :value="role">{{role}}</label>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="group-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canEdit">Save</button>
    </div>
  </div>
</template>

<script src="./group-edit.js"></script>
