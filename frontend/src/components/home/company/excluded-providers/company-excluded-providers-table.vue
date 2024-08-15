<template>
   <div class="container-fluid mb-4">
        <div class="row p-3">
          <table class="table table-sm table-bordered table-striped table-hover table-stacked">
            <thead class="hidden-xs-down">
              <tr>
                <th scope="col" style="width: 25%" v-if="canReadAll">Provider Name</th>
                <th scope="col" style="width: 25%"  v-if="canReadAll">Provider ID</th>
                <th scope="col">Notes</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody data-e2e-type="excluded-providers-body">
              <tr v-if="excludedProviders.length === 0">
                <td colspan="3" class="hidden-xs-only"/>
                <td>
                  <button
                    data-e2e-type="excluded-providers-table-add-button"
                    title="New Entry"
                    @click="addRow(0)"
                    class="fas fa-plus mr-1"
                  />
                </td>
              </tr>
              <company-excluded-providers-row
                v-for="(excludedProvider, index) of excludedProviders"
                v-model="excludedProviders[index]"
                :company-id="companyId"
                :index="index"
                :key="excludedProvider.vueKey"
                :canReadAll="canReadAll"
                :canEdit="canEdit"
                :excludedProviders="excludedProviders"
                @add-row="addRow"
                @cancel-excluded-provider="cancelExcludedProvider"
                @delete-excluded-provider="deleteExcludedProvider"
                @lock-excluded-provider="lockExcludedProvider"
                @update-excluded-provider-note="updateExcludedProviderNote"
                @handle-duplicates="handleDuplicates"
                data-e2e-type="excluded-provider-row"
              />
            </tbody>
          </table>
        </div>
      </div>
</template>

<script src="./company-excluded-providers-table.js"></script>
