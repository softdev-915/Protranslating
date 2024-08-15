import WorkflowTemplateService from '../../../../services/workflow-template-service';

export default {
  name: 'WorkflowTemplatesGridDeleteButton',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  created() {
    this._service = new WorkflowTemplateService();
  },
  methods: {
    deleteTemplate() {
      this.item.deleted = !this.item.deleted;

      this._service.delete(this.item._id, this.item.deleted);
    },
  },
};
