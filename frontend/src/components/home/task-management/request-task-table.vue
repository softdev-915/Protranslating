<template>
  <div>
    <div class="table-header">{{ title }}</div>
    <div class="table-container">
      <table
        :id="priorityStatus"
        class="table-sm table pts-data-table table-stacked table-hover table-striped table-bordered scroll"
        :class="priorityStatus">
        <thead class="hidden-sm-down">
          <tr>
            <th v-if="rowSelection" class="selection-row">
              <input
                data-e2e-type="tasks-grid-select-all-checkbox"
                type="checkbox"
                @change="selectAll"
                ref="selectAllProviderOffersCheckBox"/>
            </th>
            <th v-for="(c, i) in tableColumns" :key="i">{{ c }}</th>
          </tr>
        </thead>
        <tbody :class="hasScroll" v-if="orderedTasks.length > 0">
          <tr
            v-for="t in orderedTasks"
            :class="{ 'red-text': isTaskPastCurrentDate(t) }"
            data-e2e-type="task-management-task-row"
            :key="t.requestId">
            <td v-if="rowSelection" class="selection-row">
              <input
                type="checkbox"
                @click.stop="stopCheckBoxEventPropagation"
                @change="checkBoxChange(t._id)"
                :checked="isRowSelected(t._id)"
                data-e2e-type="task-row-select"/>
            </td>
            <td data-e2e-type="task-management-task-request-no">
              <a
                class="td-link"
                @click="onEditInline(t, $event)"
                :href="getTaskDetailLink(t)">
                <b class="hidden-xs-up">Request No.</b>{{ t.no }}
              </a>
            </td>
            <td data-e2e-type="task-management-task-language">
              <a
                class="td-link"
                @click="onEditInline(t, $event)"
                :href="getTaskDetailLink(t)">
                <b class="hidden-xs-up">Language</b>{{ t.language }}
              </a>
            </td>
            <td data-e2e-type="task-management-task-ability">
              <a
                class="td-link"
                @click="onEditInline(t, $event)"
                :href="getTaskDetailLink(t)">
                <b class="hidden-xs-up">Ability</b>{{ t.ability }}
              </a>
            </td>
            <td v-if="!showTaskStatus" data-e2e-type="task-management-task-due">
              <b class="hidden-xs-up">Task due</b>{{ t.taskDueDate | localDateTime("MM-DD-YYYY HH:mm") }}
            </td>
            <td
              v-if="showTaskStatus"
              data-e2e-type="task-management-task-status">
              <b class="hidden-xs-up">Request Status</b>{{ t.status }}
            </td>
            <td
              v-if="showProviderTaskInstructions"
              data-e2e-type="task-management-provider-offers">
              <b class="hidden-xs-up">Provider Task Instructions</b>
              <offer-instructions-modal
                v-model="openedOfferId"
                :providerTaskInstructions="t.providerTaskInstructions"
                :offerId="t._id"/>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./request-task-table.js"></script>
<style scoped lang="scss" src="./request-task-table.scss"></style>
