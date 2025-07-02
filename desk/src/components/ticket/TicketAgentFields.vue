<template>


  <div v-if="showFields" class="flex flex-1 flex-col overflow-hidden overflow-y-auto">


    <div class="flex flex-1 flex-col overflow-hidden overflow-y-auto">

      <UniInput2 v-for="field in default_fields" :key="field.fieldname" :field="field" :value="values[field.fieldname]"
        @change="(e) => handleOnFieldChange(e, field.fieldname, field.fieldtype)" />
      <hr v-if="default_fields.length" class="mb-2 mt-2" />
      <UniInput2 v-for="field in fields" :key="field.fieldname" :field="field" :value="values[field.fieldname]"
        @change="(e) => handleOnFieldChange(e, field.fieldname, field.fieldtype)" />

    </div>


    <div v-if="hasChanged" class="flex gap-1 justify-end text-sm text-gray-500 px-6 py-2.5 border-t">
      <Button :label="__('Update')" :loading="isSaving" :loadingText="__('Saving...')" @click="updateData" theme="gray"
        variant="solid" />
      <Button :label="__('Reset')" v-if="!isSaving" @click="resetValues" theme="red" variant="solid" />
    </div>


  </div>
</template>

<script setup lang="ts">
import { Field, FieldValue } from "@/types";
import { toast } from "frappe-ui";
import { ref, reactive, computed , onMounted, isReactive } from "vue";
import { parseField, cascadeFilterChanges } from "@/composables/formCustomisation";
import UniInput2 from "../UniInput2.vue";
import { createResource } from "frappe-ui";

const emit = defineEmits(["update"]);

const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  },
});

const showFields = ref(false);
const isSaving = ref(false);

onMounted(() => {


  // template fields
  props.ticket.template.fields.sort((a,b)=> a.idx - b.idx).forEach(f => {
    values[f.fieldname] = ref(props.ticket[f.fieldname]) || "";
    fields.push(parseField(f, values));
  });

  // default fields
  let names = fields.map(f => f.fieldname);
  props.ticket.fields.filter(f=> !names.includes(f.fieldname)).forEach(f => {
      values[f.fieldname] = reactive(props.ticket[f.fieldname]) || "";
      //console.log(isReactive(values[f.fieldname]));
      default_fields.push(parseField(f, values));
  });



  originalValues = reactive(JSON.parse(JSON.stringify(values)));

/*   fields.forEach(f=> {
    cascadeFilterChanges(f.fieldname, fields, values);
  });
 */

  showFields.value = true;

});


var values = reactive({});
var originalValues = reactive({});

const default_fields = reactive([]);
const fields = reactive([]);

function resetValues() {
  // Reset the values to the original state
  for (const key in originalValues) {
    values[key] = originalValues[key];
  }

  //values = reactive(JSON.parse(JSON.stringify(originalValues)));

  //values = reactive(JSON.parse(JSON.stringify(originalValues)));
  //Object.keys(values).forEach((key) => {
  //});
}


function handleOnFieldChange(e: any, fieldname: string, fieldtype: string) {

  values[fieldname] = e.value;
  //cascadeFilterChanges(fieldname, fields, values);

}

function updateData() {

let _values = {};
 default_fields.concat(fields).forEach((field) => {
  _values[field.fieldname] = values[field.fieldname] || "";
 });
 
 isSaving.value = true;
  createResource({
    url: "frappe.client.set_value",
    params: {
      doctype: "HD Ticket",
      name: props.ticket.name,
      fieldname: _values,
    },
    debounce: 500,
    auto: true,
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      // Update the original values after successful update
       for (const key in originalValues) {
          originalValues[key] = _values[key];
       }
      
 
      emit("update", { field: "all", value: values });
      isSaving.value = false;
    },
    onError: (error) => {
      const text = error.exc_type
      ? (error.messages || error.message || []).join(", ")
      : error.message;
      toast.error(text);
      isSaving.value = false;
    },
  });


}

const hasChanged = computed(() => {
  return Object.keys(values).some((key) => {
    return values[key] !== originalValues[key];
  });
});

/* function update(field: Field["fieldname"], value: FieldValue, event = null) {
  if (field === "subject" && value === "") {
    toast.error("Subject is required");
    event.target.value = props.ticket.subject;
    return;
  }
  emit("update", { field, value });
} */

</script>
<style scoped>
:deep(.form-control input:not([type="checkbox"])),
:deep(.form-control select),
:deep(.form-control textarea),
:deep(.form-control button) {
  border-color: transparent;
  background: white;
}
:deep(.form-control textarea) {
  field-sizing: content;
}

:deep(.form-control button) {
  gap: 0;
}
:deep(.form-control [type="checkbox"]) {
  margin-left: 9px;
  cursor: pointer;
}

:deep(.form-control button > div) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.form-control button svg) {
  color: white;
  width: 0;
}
</style>
