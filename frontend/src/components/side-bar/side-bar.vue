<template>
  <nav aria-label="Main menu" role="navigation" data-e2e-type="sidebar">
    <div class="profile-picture">
      <a title="Click to change avatar" data-e2e-type="user-avatar">
        <router-link :to="{ name: 'user-profile-image'}" class="change-profile-image-pencil">
          <span class="screen-reader-text">Change profile image</span>
          <img v-if="userProfileImage" class="pts-rounded-image" :src="userProfileImage" alt="Profile picture">
          <img v-else class="pts-rounded-image" src="@/assets/images/avatar.png" alt="Profile picture">
          <i class="fas fa-pencil" aria-hidden="true" id="image-edit-icon"></i>
        </router-link>
      </a>
      <div class="stats-label text-color">
        <span class="pts-font-extra-bold pts-uppercase">{{userLogged.firstName}} {{userLogged.lastName}}</span>
        <div>
          <b-dropdown
            data-e2e-type="profile-settings-dropdown-container"
            text="Profile settings" variant="secondary" class="pts-small-dropdown">
            <router-link :to="{ name: 'user-profile-image'}" class="dropdown-item">Change Profile Image</router-link>
            <router-link :to="{ name: 'ui-settings'}" class="dropdown-item">Change UI Settings</router-link>
            <hr />
            <span v-if="!isSSOEnabled" class="font-weight-bold pl-4">Security</span>
            <router-link v-if="!isSSOEnabled" :to="{ name: 'change-password'}" class="dropdown-item" data-e2e-type="change-password-page-link">Change Password</router-link>
            <router-link v-if="!isSSOEnabled" :to="{ name: 'two-factor-authentification-settings'}" class="dropdown-item" data-e2e-type="2fa-page-link">Two-Factor Authentication</router-link>
            <a @click="performLogout" class="dropdown-item logout-dropdown">Logout</a>
          </b-dropdown>
        </div>
        <div v-if="userLogged.lastLoginAt" data-e2e-type="user-last-login">
          Last Login: {{ lastLoginAtDate }}
        </div>
        <div data-e2e-type="user-location">
          Location: {{ locationString }}
        </div>
        <div v-if="!isTimezoneDropdownActive" data-e2e-type="user-timezone" @click="toggleTimezoneDropdown">
          Timezone:
          {{ userLogged.timeZone.value }}
          {{ userLogged.timeZone.isAutoDetected ? '(auto-detected)' : '(selected)' }}
          <i class="fas fa-caret-down"></i>
        </div>
        <div v-else>
          <simple-basic-select
            :value="userLogged.timeZone.value"
            :options="timezones"
            data-e2e-type="user-timezone-dropdown"
            class="p-2"
            @input="saveTimezone"
          />
        </div>
      </div>
    </div>
    <div>
      <ul id="sidebar-navigator" class="pts-uppercase" data-e2e-type="sidebar-navigator-list">
        <router-link :to="{ name: 'ip-quote-dashboard' }" tag="li" activeClass="active" exact-path v-if="canCreateIPQuotes"><span>Create Quote</span></router-link>
        <router-link :to="{ name: 'ip-order-dashboard' }" tag="li" activeClass="active" exact-path v-if="canCreateIPOrders"><span>Create Order</span></router-link>
        <router-link :to="{ name: 'create-request' }" tag="li" activeClass="active" exact v-if="canCreateRequests && !supportsIpQuoting"><span>Create Request</span></router-link>
        <router-link
            v-if="canReadPortalTranslator"
            to="/mt-translator"
            activeClass="active"
            class="portal-translator-link"
            tag="li" >
          <span class="nav-label">Portal Translator</span>
        </router-link>
        <router-link :id="dashboardLinkId" :to="dashboardRoute" activeClass="active" tag="li" v-if="canUseDashboard">
          <span class="nav-label">Dashboard</span>
        </router-link>
        <router-link to="/quotes" activeClass="active" tag="li" v-if="canReadQuotes">
          <span class="nav-label">Quotes</span>
        </router-link>
        <router-link
          v-if="canReadRequests"
          tag="li"
          activeClass="active"
          :to="{ name: 'list-request' }"
          :class="{ 'active-override': currentRouteMatchCreate }">
          <span>{{requestLinkLabel}}</span>
        </router-link>
        <router-link :to="{ name: 'task-management' }" activeClass="active" tag="li" v-if="canReadTasks">
          <div class="container-fluid p-0">
            <div class="row align-items-center">
              <div class="col-9">
                <span>Tasks</span>
              </div>
              <div class="col-3">
                <side-bar-chip :loading="loadingTasks" :number="pendingTaskCount"/>
              </div>
            </div>
          </div>
        </router-link>
        <router-link id="itemlistBill" :to="{ name: 'list-bill' }" activeClass="active" tag="li" v-if="canReadBills">
          <span class="nav-label">Bills</span>
        </router-link>
         <router-link id="itemlistArAdvances" :to="{ name: 'advances' }" activeClass="active" tag="li" v-if="canReadArPayments">
          <span class="nav-label">Advances</span>
        </router-link>
        <router-link
          v-if="canReadArAdjustments"
          id="itemlistArAdjustments"
          activeClass="active"
          tag="li"
          :to="{ name: 'adjustments' }">
          <span class="nav-label">Adjustments</span>
        </router-link>
        <router-link
          v-if="canReadInvoices"
          id="itemlistArInvoice"
          tag="li"
          activeClass="active"
          :to="{ name: 'invoices' }">
          <span class="nav-label">Invoices</span>
        </router-link>
         <router-link
          id="itemlistArPayments"
          :to="{ name: 'payments' }" activeClass="active" tag="li" v-if="canReadArPayments">
          <span class="nav-label">Payments</span>
        </router-link>
        <router-link
          v-if="canReadCcPayments"
          tag="li"
          id="itemlistArPayments"
          activeClass="active"
          :to="{ name: 'cc-payments' }">
          <span class="nav-label">CC Payments</span>
        </router-link>
      </ul>
    </div>
  </nav>
</template>
<script src="./side-bar.js"></script>

<style scoped lang="scss" src="./side-bar.scss"></style>
<style scoped lang="scss" src="./side-bar-global.scss"></style>
