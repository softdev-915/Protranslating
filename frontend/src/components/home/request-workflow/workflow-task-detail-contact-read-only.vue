<template>
  <table
    data-e2e-type="contact-workflow-task-detail-read-only"
    class="contact-workflow-table">
    <thead>
      <th>Language Combination</th>
      <th>Task Name</th>
      <th>Task Description</th>
      <th>Provider Task Status</th>
      <th>Provider Task Due Date</th>
    </thead>
    <tbody>
      <tr data-e2e-type="contact-workflow-task-detail-row-read-only" v-for="(task, taskIdx) in tasks">
        <td :class="{'language-combination': taskIdx === 0}">
          <span data-e2e-type="contact-workflow-source-language-read-only" class="language">{{srcLang}}</span>
          <i class="px-2 fas fa-arrow-right" aria-hidden="true"></i>
          <span data-e2e-type="contact-workflow-target-language-read-only" class="language">{{tgtLang}}</span>
        </td>
        <td data-e2e-type="contact-workflow-name-read-only">{{ task.ability }}</td>
        <td data-e2e-type="contact-workflow-description-read-only">{{ task.description }}</td>
        <td data-e2e-type="contact-workflow-provider-task-status-read-only">
          {{ task.providerTaskStatus }}</td>
        <td data-e2e-type="contact-workflow-provider-task-due-date-read-only">
          {{task.providerDueDate | localDateTime('YYYY-MM-DD HH:mm')}}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss" src="./workflow-task-detail-contact-read-only.scss"></style>

<script src="./workflow-task-detail-contact-read-only.js"></script>
