<template>
    <div class="container grid-config-dropdown-section p-0 m-0">
      <div class="dropdown-header">
        <a
          v-if="showSelectAllButton"
          class="pts-clickable pull-right select-all-button"
          data-e2e-type="grid-select-all-button"
          @click="onSelectAllClick">{{ selectAllColumnsLabel }}
        </a>
        <h6 >Columns</h6>
      </div>
      <div class="dropdown-item" v-for="(col,index) in columns" :key="index" :data-e2e-type="col.name">
        <span class="pl-1 pull-right">
          <input class="pts-clickable" type="checkbox" value="true" @click="onVisiblityChange($event, col)" :checked="col.visible" :disabled="col.visible && visibleCount === 1">
        </span>
        <span class="pull-right pts-clickable dropdown-item-action">
          <span @click="columnMove($event, col, index, index - 1)" v-show="index !== 0">
            <i class="fas fa-arrow-up"></i></span>
          <span class="dropdown-item-action" @click="columnMove($event, col, index, index+ 1)" v-show="index !== columns.length - 1">
            <i class="fas fa-arrow-down"></i></span>
        </span>
        <span>{{col.name}}</span>
      </div>
      <div v-if="saveGridConfigAvailable || gridConfigs.length > 0" data-e2e-type="grid-config-li">
        <div class="dropdown-divider"></div>
        <h6 class="dropdown-header">Layouts</h6>
        <div class="dropdown-item">
          <span class="pts-clickable" :class="{'grid-config-selected': noConfigSelected}" @click="onGridConfigSelected(null)">Default</span>
        </div>
        <div class="dropdown-item" v-for="config in gridConfigs">
          <span class="pull-right pts-clickable" @click="onGridConfigDelete(config.name)"><i class="fas fa-trash"></i></span>
          <!-- When multiple configs are available, this span should be hidden upon edition to allow the input edition to set the
          new configuration's name. To achive that add => `v-if="!config.new"` to the following span -->
          <span class="pts-clickable" :class="{'grid-config-selected': config.selected}" @click="onGridConfigSelected(config.name)">{{config.name}}</span>
          <!-- <span v-if="config.new"><input class="form-group" ref="configInput" type="text" placeholder="New layout name" v-model.trim="newConfigName" @click="$event.stopPropagation()" @keyup.enter="onConfigSave($event)"></span> -->
        </div>
        <!-- creating more than on config per grid is now disabled, uncomment the button to enable it  -->
        <!-- <button class="btn btn-primary btn-block btn-small" v-show="!isCreatingConfig" @click="onNewConfig($event)">New layout</button> -->
        <div class="dropdown-item form-actions">
          <button class="btn btn-primary btn-block btn-small" v-show="!noConfigSelected" @click="onConfigSave(selectedConfig)">Save config</button>
         </div>
      </div>
      <div v-else class="form-actions">
        <button data-e2e-type="save-grid-config" class="btn btn-primary btn-block btn-small" @click="onConfigSave()">Save config</button>
      </div>
  </div>
</template>

<script src="./grid-configuration-dropdown.js"></script>

<style scoped lang="scss" src="./grid-configuration-dropdown.scss"></style>
