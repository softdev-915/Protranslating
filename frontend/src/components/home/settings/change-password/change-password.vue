<template>
  <div class="container change-password-main">
    <div class="row align-items-center change-password-centered">
      <div class="container pts-panel-body">
        <div class="row mt-2">
          <h3 class="col-12 offset-md-3 col-md-6 text-center">CHANGE PASSWORD</h3>
        </div>
        <form name novalidate class="row mt-3">
          <div class="col-12 form-group">
            <div class="input-group pl-1">
              <label class="control-label" for="currentPassword">Your current Password</label>
              <input
                @keypress="dirtyForm = true"
                v-model="passwords.password"
                placeholder="Current password"
                type="password"
                name="currentPassword"
                id="currentPassword"
                class="form-control col-12"
                style="background-image: url(&quot;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAASCAYAAABSO15qAAAAAXNSR0IArs4c6QAAAUBJREFUOBGVVE2ORUAQLvIS4gwzEysHkHgnkMiEc4zEJXCMNwtWTmDh3UGcYoaFhZUFCzFVnu4wIaiE+vvq6+6qTgthGH6O4/jA7x1OiCAIPwj7CoLgSXDxSjEVzAt9k01CBKdWfsFf/2WNuEwc2YqigKZpK9glAlVVwTTNbQJZlnlCkiTAZnF/mePB2biRdhwHdF2HJEmgaRrwPA+qqoI4jle5/8XkXzrCFoHg+/5ICdpm13UTho7Q9/0WnsfwiL/ouHwHrJgQR8WEwVG+oXpMPaDAkdzvd7AsC8qyhCiKJjiRnCKwbRsMw9hcQ5zv9maSBeu6hjRNYRgGFuKaCNwjkjzPoSiK1d1gDDecQobOBwswzabD/D3Np7AHOIrvNpHmPI+Kc2RZBm3bcp8wuwSIot7QQ0PznoR6wYSK0Xb/AGVLcWwc7Ng3AAAAAElFTkSuQmCC&quot;); background-repeat: no-repeat; background-attachment: scroll; background-size: 16px 18px; background-position: 98% 50%;"
                autocomplete="off">
              <b-popover triggers="hover" placement="left">
                <span class="fas fa-question-circle cursor-pointer" id="currentPasswordHint"></span>
                <span slot="content">Enter the password used to login</span>
              </b-popover>
            </div>
            <div class="invalid-text" v-show="showInvalidPassword">
              <span class="text-danger">
                <i class="fas fa-exclamation-triangle"></i> Invalid password
              </span>
            </div>
            <div class="not-typed-text" v-show="showEmptyPassword">
              <span class="text-danger" id="currentPassEmpty">
                <i class="fas fa-exclamation-triangle"></i> You did not type your current password
              </span>
            </div>
          </div>
          <confirm-password v-model="passwords" :passwordErrorMessage="passwordErrorMessage"></confirm-password>
        </form>
        <div class="row">
          <div class="col-6 col-lg-6 align-self-center" v-show="!loading">
            <router-link :to="{ path: '/' }" class="btn btn-default btn-block">Cancel</router-link>
          </div>
          <div class="col-12 col-lg-12 align-self-center" v-show="loading">
            <p class="text-center col-lg-12">
              <img alt="Loading" src="@/assets/images/loader.gif" width="26">
            </p>
          </div>
          <div class="col-6 col-lg-6 align-self-center" v-show="!loading">
            <button
              :disabled="!isValid"
              data-e2e-type="change-password"
              class="btn btn-primary btn-block"
              @click="send">Ok</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script src="./change-password.js"></script>
<style scoped src="./change-password.scss" lang="scss"></style>
