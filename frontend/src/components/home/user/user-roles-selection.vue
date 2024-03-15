<template>
  <div class="container-fluid" id="rolesSelector">
    <div class="row align-items-center" id="rolesList">
      <div class="col-12 col-md-4 checkbox-modal-window" v-for="role in roles" :key="role">
        <label class="pts-clickable form-check"><input type="checkbox" v-model="rolesSelected" :value="role">{{role}}</label>
      </div>
    </div>
  </div>
</template>

<script src="./user-roles-selection.js"></script>
