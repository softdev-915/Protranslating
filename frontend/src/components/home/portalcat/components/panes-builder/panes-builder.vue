<template>
  <multipane
    layout="horizontal"
    :controlDimensions="false"
    @paneResizeStop="onPaneResizeStop"
    @paneResize="onPaneResize"
    @paneResizeStart="onPaneResizeStart">
    <draggable
      :value="widgets"
      :group="`${side}_widgets`"
      class="draggable"
      draggable=".pane"
      handle='.widget-header'
      :move="canMove"
      @end="onDragEnd">
      <template v-for="(widget, index) in widgets">
        <div
          class="pane"
          :ref="`pane-${widget.name}`"
          :class="{ minimized: widget.config ? widget.config.minimized : false }"
          :data-widget-index="index"
          :key="widget.name"
          :style="{
                height: getWidgetHeight(widget),
                flexGrow: canGrow(widgets, widget, index) ? 1 : 0,
                flexBasis: widget.config && widget.config.minimized ? '0%' : 'auto'
              }"
        >
          <component
            :is="widget.component"
            v-bind="getConfigWithWrappedAttrs(widget)"
            :iconClass="widget.iconClass"
            :widgetProps="{ minimizable: widgets.length > 1, headerTitle: widget.title, minimized: widget.config && widget.config.minimized }"
            @config-change="$emit('config-change', $event)"
            @action-config="$emit('action-config', $event)"
            @lock-segments="$emit('lock-segments')"
            @minimize="$emit('minimize', { widgets, widget, index, el: $refs[`pane-${widget.name}`][0], sideName: side })"
            @maximize="$emit('maximize', { widgets, widget, index, el: $refs[`pane-${widget.name}`][0], sideName: side })">
            </component>
        </div>
        <multipane-resizer
          v-if="!isLast(widgets, index)"
          :key="`${widget.name}_resizer`"
          data-e2e-type="widgets-pane-resizer"
        ></multipane-resizer>
      </template>
    </draggable>
  </multipane>
</template>

<script src="./panes-builder.js"></script>
