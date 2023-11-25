<template>
  <nav id="header" role="navigation" class="app-header row align-items-center" aria-label="Top menu">
      <router-link
        class="hidden-sm-down col-md-4 col-lg-2 pts-clickable p-0"
        :class="{'no-logo': !hasLogo }"
        id="logo"
        tag="a"
        :to="{name:'home'}"
        :title="lspName"
      >
        <img v-if="hasLogo" :src="lspLogo" :alt="lspOfficialName || lspName" />
        <h6 class="m-0" v-else>{{ lspOfficialName || lspName }}</h6>
      </router-link>
      <div class="col-3 col-md-1 pl-0">
        <button
          @click="toggleCollapse()"
          class="header-link pull-left"
          type="button"
          aria-expanded="false"
          aria-label="Toggle navigation"
          data-e2e-type="left-panel-collapse-button"
        >
          <i class="fas fa-bars"></i>
        </button>
      </div>
      <div class="col-md-7 col-lg-9 pr-0 header-right-section">
        <ul class="nav no-borders pull-right header-buttons">
          <li class="header-button">
            <button
              data-e2e-type="sitemap-button"
              v-if="isSitemapVisible"
              @click="setSitemap(true)"
              class="header-link"
              type="button"
              aria-expanded="false"
              aria-label="Sitemap"
              title="Sitemap"
            >
              <i class="fas fa-sitemap" aria-hidden="true"></i>
            </button>
          </li>
          <li class="header-button" v-if="canCreateActivityEmail">
            <eml-file-upload></eml-file-upload>
          </li>
          <li class="header-button">
            <button @click="refresh()" class="header-link" type="button" aria-expanded="false" aria-label="Reload page" title="Reload">
              <i class="fas fa-refresh" aria-hidden="true"></i>
            </button>
          </li>
          <li class="header-button hidden-md-down" data-e2e-type="app-help-open-button">
            <button @click="setHelp(true)" class="header-link" type="button" aria-expanded="false" aria-label="HELP" title="HELP">
              <i class="fas fa-question" aria-hidden="true"></i>
            </button>
          </li>
          <li class="header-button">
            <button
              id="logout"
              data-e2e-type="logout-button"
              @click="performLogout"
              class="header-link"
              type="button"
              aria-expanded="false"
              aria-label="Exit"
              title="Exit"
            >
                <i class="fas fa-sign-out" aria-hidden="true"></i>
              </button>
          </li>
        </ul>
      </div>
      <div class="col-8 hidden-md-up vertical-center small-logo"></div>
      <div @click="performLogout" class="col-12 hidden-md-up vertical-center collapse small-logout" data-e2e-type="small-logout-button">
        <span>Logout</span>
      </div>
  </nav>
</template>
<script src="./app-header.js"></script>
<style scoped lang="scss" src="./app-header.scss"></style>
