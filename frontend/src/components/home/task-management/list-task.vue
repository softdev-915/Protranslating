<template>
  <div
    class="container-fluid pts-data-table-container"
    data-e2e-type="task-management-container"
  >
    <offers-notification
      v-model="cachedOffers"
      :provider-id="providerId"
      @refresh-tasks="refreshTasks"
    ></offers-notification>
    <div class="mx-2 mb-3 mt-5">
      <h5>Provider</h5>
      <div>
        <hr class="my-1" />
      </div>
    </div>

    <div class="row">
      <div class="col-6">
        <div class="m-2 user-selector-container" v-if="canReadAll">
          <user-ajax-basic-select
            id="providerSelect"
            :selected-option="providerSelected"
            :filter="{ terminated: false }"
            :is-disabled="isLoading"
            @select="onProviderSelected"
            title="Provider list"
          >
          </user-ajax-basic-select>
        </div>
      </div>

      <div class="col-6">
        <div class="m-2">
          <button
            data-e2e-type="task-management-completed-task-button"
            class="btn btn-primary pull-right"
            @click="onCompletedTasks"
            :disabled="areTasksLoading"
          >
            Completed tasks
          </button>
        </div>
      </div>
    </div>
    <div id="tasks" class="m-2">
      <!-- Tasks buckets -->
      <request-task-table
        :tasks="currentTasks"
        @on-task-loading="onTaskLoading"
        data-e2e-type="task-management-current-tasks"
        @onTaskEdit="onTaskEdit"
        :title="'Current tasks'"
        :priorityStatus="'current'"
        :provider="providerSelected"
      ></request-task-table>
      <request-task-table
        :tasks="pendingTasks"
        @on-task-loading="onTaskLoading"
        data-e2e-type="task-management-pending-tasks"
        @onTaskEdit="onTaskEdit"
        :title="'Pending tasks'"
        :priorityStatus="'pending'"
        :provider="providerSelected"
      ></request-task-table>
      <request-task-table
        :tasks="futureTasks"
        @on-task-loading="onTaskLoading"
        data-e2e-type="task-management-future-tasks"
        @onTaskEdit="onTaskEdit"
        :title="'Future tasks'"
        :priorityStatus="'future'"
        :provider="providerSelected"
      ></request-task-table>
    </div>
    <div class="mx-2 mb-1 mt-5">
      <h5>Provider Offers</h5>
      <div>
        <hr class="my-1" />
      </div>
    </div>

    <div
      class="tasks-management-provider-offers mx-2 mb-3"
      v-if="showOffersTable"
    >
      <div class="row">
        <div class="d-flex col-6 py-3">
          <button
            class="btn btn-primary mr-2 accept-button"
            data-e2e-type="accept-selected-btn"
            :disabled="noOffersSelected || areOffersLoading"
            @click="acceptSelectedOffers"
          >
            Accept Selected
          </button>
          <decline-select
            class="decline-select"
            data-e2e-type="reason-for-declining"
            :options="decliningReasonOptions || areOffersLoading"
            title="Decline Selected"
            sub-title="Reason for Declining"
            :is-disabled="noOffersSelected"
            @select="declineSelectedOffers"
          />
        </div>
      </div>
      <request-task-table
        :tasks="offers"
        @on-task-loading="onTaskLoading"
        data-e2e-type="task-management-provider-offers"
        @onTaskEdit="onTaskEdit"
        priorityStatus="offers"
        :provider="providerSelected"
        :selected-rows="selectedOffers"
        @row-selected="onRowSelected"
        @select-all="selectAllOffers"
      >
      </request-task-table>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./list-task.scss"></style>
<script src="./list-task.js"></script>
