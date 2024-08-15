<template>
  <div>
    <b-breadcrumb :items="items" @click="nav"></b-breadcrumb>
    <div class="sections">
      <router-view
        @task-details="onTaskDetails"
        @task-navigate-request="taskNavigateRequest"
      ></router-view>
    </div>
  </div>
</template>

<script src="./task-section.js"></script>
