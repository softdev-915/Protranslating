<template>
    <div class="container-fluid" id="groupsSelector">
      <div class="row align-items-center" id="groupsList">
        <div class="col-12 col-md-4 checkbox-modal-window" v-for="group in groups" :key="group._id">
          <label class="pts-clickable">
            <input type="checkbox" :id="group.name" :value="group._id" :disabled="group.deleted || group.disabled" @click="onGroupClick($event, group._id)" :checked="isChecked(group)">{{group.name}}
          </label>
        </div>
      </div>
    </div>
</template>

<script src="./user-groups-selection.js"></script>
