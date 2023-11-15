<template>
  <div id="app" :class="browserClass">
    <version-update></version-update>
    <div class="notification-manager">
      <notification-manager :allow-auto-dismiss="true"></notification-manager>
    </div>
    <div>
      <view-search></view-search>
      <app-help></app-help>
    </div>
    <div v-if="showLoadingSplash">
      <div class="splash">
        <div class="splash-title">
          <h1><span class="red">BIG</span> <span>LANGUAGE SOLUTIONS</span></h1>
          <img src="@/assets/images/loading-bars.svg" width="64" height="64" alt="Loading">
          </div>
      </div>
    </div>
    <div v-else class="private-app" @click="onGlobalEvent($event, 'main-app')" @keydown="onGlobalEvent($event, 'main-app')">
      <div v-if="!userLogged" id="login-container" class="container-fluid">
        <router-view name="login"></router-view>
      </div>
      <div v-else-if="isStandaloneRoute" class="container-fluid main-container">
        <router-view></router-view>
      </div>
      <div v-else class="container-fluid main-container">
        <router-view name="header"></router-view>
        <div class="row main-view">
          <div class="col-12 main-and-sidebar" :class="{'toggled': !isCollapsed}">
            <transition
              @after-enter="onAfterSidebarEnter"
              @after-leave="onAfterSidebarLeave"
              appear
              enter-class="show"
              enter-active-class="collapsing animate__animated animate__slideInLeft"
              leave-active-class="collapsing animate__animated animate__slideOutLeft"
            >
              <div class="side-bar pull-left" v-show="!isCollapsed" data-e2e-type="home-side-bar">
                <router-view name="sidebar"></router-view>
              </div>
            </transition>
            <div class="col main-slot pull-right bordered-left">
              <router-view></router-view>
                <div class="container-fluid footer-container p-0">
                  <div class="row">
                    <div class="col-12 footer-col">
                      <home-footer></home-footer>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./app.js"></script>

<style src="./app_global.scss" lang="scss"></style>
<style scoped src="./app.scss" lang="scss"></style>
