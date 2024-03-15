<template>
  <div>
    <b-breadcrumb :items="items" @click="nav"></b-breadcrumb>
    <div
      class="sections"
      v-for="(section, index) in items"
      :key="index"
      v-show="section.active"
    >
      <div v-if="section.type == 'active-user-sessions-grid'">
        <active-user-sessions-grid :ref="index + ''"></active-user-sessions-grid>
      </div>
    </div>
  </div>
</template>

<script src="./active-user-sessions-section.js"></script>
