<template>
    <i
        v-if="status === SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR"
        class="fas fa-check status-confirmed-translator"
        :title="withTitle && 'Confirmed by translator'"></i>
    <i
        v-else-if="status === SEGMENT_STATUS_CONFIRMED_BY_EDITOR"
        class="fas fa-check-double status-confirmed-editor"
        :title="withTitle && 'Confirmed by editor'"></i>
    <i
        v-else-if="status === SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR"
        class="fas fa-check-double status-confirmed-qa"
        :title="withTitle && 'Confirmed by QA editor'"></i>
    <i v-else class="fas fa-check" :title="withTitle && 'Unconfirmed'"></i>
</template>

<script src="./status-icon.js"></script>