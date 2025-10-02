<template>
  <div v-if="fieldsInitialized == true"
    class="h-full overflow-y-hidden flex flex-1 flex-col  overflow-hidden max-h-full">
    <!-- User avatar and core fields -->
    <div class="px-5 pb-4 flex flex-col">
      <!-- User avatar with buttons -->
      <TicketContact />
      <!-- Core Fields -->
      <div>
        <div v-for="(section, index) in coreFields" :key="index" :class="
            section.group ? 'flex gap-2 items-center w-full mb-3' : 'mb-3'
          ">
          <template v-for="field in section.fields">

            <Link v-if="field.visible" :key="field.fieldname" class="form-control-core"
              :class="section.group ? 'flex-1' : 'w-full'" :page-length="10" :label="field.label"
              :placeholder="field.placeholder" :doctype="field.doctype" :modelValue="field.value"
              :required="field.required" @update:model-value="
              (val:string) => handleFieldUpdate(field.fieldname, val,true)
            " />
          </template>
        </div>

        <!-- Assignee component -->
        <AssignTo />
      </div>
    </div>

    <!-- Additional Fields -->
    <div class="border-t flex flex-col flex-grow pb-3 gap-4 p-3 overflow-y-auto h-[60%]">

      <div class="flex items-center text-base leading-5" v-for="field in customFields">
        <span class="w-[126px] text-sm text-gray-600">{{ __(field.label) }}</span>
        <span :dir="getDirection() == 'rtl' && field.fieldtype == 'Phone' ? 'ltr' : ''"
          :class="'text-base text-gray-800 flex-1 ' + (field.fieldtype === 'Phone' && getDirection() == 'rtl' ? 'text-end ' : '') + (!field.value && ' text-ink-gray-4')">
          {{ __(field.value) || "-" }}
        </span>
      </div>





      <!-- TODO: Hack of 85 % for now, will refactor -->
      <!--   <div class="overflow-y-scroll" :class="!hasChanges ? 'h-[85%]' : ''">
        <template v-for="field in customFields">
          <TicketField v-if="field.display_via_depends_on" :key="field.fieldname" :field="field" :value="field.value" @change="
              ({ fieldname, value }) => handleFieldUpdate(fieldname, value)
            " />
        </template>
      </div> -->
    </div>

    <div class="border-t px-3 h-[97px] py-4 md:py-2.5">

      <button
        class="px-4 h-[30px] w-full leading-none rounded font-medium border-0 border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100 transition-colors shadow-none"
        @click="updateTicket(ticket.value)">
        {{ __('Update') }}
      </button>

    </div>

    <div class="border-t flex gap-2 justify-end p-2 pb-5 mb-[31px]" v-if="hasChanges && !isCoreFieldBeingUpdated">
      <button
        class="bg-blue-100 text-blue-800 px-4 h-[35px] leading-none py-2 rounded hover:bg-blue-200  transition-colors font-medium border border-blue-300"
        @click="confirmSubmit">{{ __('Save') }}</button>
      <button
        class="bg-gray-100 text-gray-800 px-4 h-[35px] leading-none py-2 rounded hover:bg-gray-200 transition-colors font-medium border border-gray-300"
        @click="discardChanges">{{ __('Cancel') }}</button>
      <ConfirmationDialog v-if="showConfirmationDialog" :message="confirmationMessage" @confirm="handleConfirmation"
        @cancel="cancelConfirmation" />
    </div>

  </div>



</template>

<script setup lang="ts">
import { Link } from "@/components";
import { parseField } from "@/composables/formCustomisation";
import { useNotifyTicketUpdate } from "@/composables/realtime";
import { getDirection } from "@/languages";
import {
  AssigneeSymbol,
  CustomizationSymbol,
  FieldValue,
  TicketSymbol,
} from "@/types";
import { inject, ref, isRef } from "vue";
import TicketField from "../TicketField.vue";
import AssignTo from "./AssignTo.vue";
import TicketContact from "./TicketContact.vue";
import ConfirmationDialog from "../ConfirmationDialog.vue";
import {
  createResource,
} from "frappe-ui";
import { __ } from "@/translation";
const ticket = inject(TicketSymbol);
const assignees = inject(AssigneeSymbol);
const customizations = inject(CustomizationSymbol);
//let getFields, getField;
const { notifyTicketUpdate } = useNotifyTicketUpdate(ticket.value?.name);


const template = createResource({
  url: "helpdesk.helpdesk.doctype.hd_ticket_template.api.get_one",
  makeParams: () => ({
    name: "Default",
    include_default_fields: true,
  }),
  auto: true,
  onSuccess: async (data) => {
/*     description.value = data.description_template || "";
    oldFields = window.structuredClone(data.fields || []);
    setupCustomizations(template, {
      doc: templateFields,
      call,
      router,
      $dialog,
      applyFilters,
    });


    setupTemplateFields(data.fields);
    visibleFields.push(...generateVisibleFields()); */
    await initializedCoreFields();
    await initializeCustomFields()
    fieldsInitialized.value = true;
  },
});



const fieldsInitialized = ref(false);

function getField(fieldname: string) {
  return template.data.fields.find(f => f.fieldname === fieldname);
}

// ticket_type, priority, customer, agent_group
const coreFields = ref([]);
async function initializedCoreFields() {
  // TODO: to confirm whether customizations should apply to core fields as well
  //const fieldsMeta = await getFields();

  //if (!fieldsMeta || fieldsMeta.length === 0) {
  //  return [];
  //}
  const _coreFields = [
    //{ group: true, fields: [getField("priority")] },
    { group: false, fields: [getField("customer")] },
    { group: true, fields: [getField("agent_group")] },
  ];


  template.data.default_fields.forEach((f) => {
    //section.fields = section.fields.map((f) => {
      f = parseField(f, ticket.value.doc, true);
      // cant handle required depends on as we directly set the value in DB on change
      f["required"] = f.reqd;
      //f = getFieldInFormat(f, f);
      f["visible"] = true;
      return f;
    //});
  });
  coreFields.value = _coreFields;
};




const customFields = ref([]);

async function initializeCustomFields() {

  console.log(ticket.value.doc);

/*   const fieldsMeta = await getFields();
  if (!fieldsMeta || fieldsMeta.length === 0) {
    return [];
  } */

  //if (!customizations.value.data || customizations.value.loading) return [];
  
  //let _fields = customizations.value.data?.custom_fields || [];
  
  const _coreFields = [
    //"ticket_type",
    //"priority",
    "customer",
    "agent_group",
    "subject",
    "status",
  ];
  let _fields = template.data.fields.filter((f) => !_coreFields.includes(f.fieldname));
  let _customFields = _fields.map((f) => {
  let fieldMeta = getField(f.fieldname);
  // if field not exist in ticket.value.doc, create it with null value
  if (!(f.fieldname in ticket.value.doc)) {
    console.log('missing field', f.fieldname);
    //console.log('adding missing field to doc', f.fieldname);
    //ticket.value.doc[f.fieldname] = null;
  }
  
  fieldMeta = parseField(fieldMeta, ticket.value.doc, true);
    return fieldMeta;
    //return getFieldInFormat(f, fieldMeta);
  });
  customFields.value = _customFields;
};

function getFieldInFormat(fieldTemplate, fieldMeta) {
  return {
    label: fieldMeta?.label || fieldTemplate.fieldname,
    value: ref(ticket.value.doc[fieldTemplate.fieldname]),
    fieldtype: fieldMeta?.fieldtype,
    doctype: fieldMeta?.options || "",
    options: fieldMeta?.options || "",
    placeholder:
      fieldTemplate.placeholder ||
      `${__('Enter')} ${fieldMeta?.label || fieldTemplate.fieldname}`,
    readonly: Boolean(fieldMeta.readonly),
    disabled: Boolean(fieldMeta.readonly),
    url_method: fieldTemplate.url_method || "",
    fieldname: fieldTemplate.fieldname,
    required: fieldTemplate.required || fieldMeta?.required || false,
    visible: fieldMeta.display_via_depends_on && !fieldMeta.hidden,
  };
}



const showConfirmationDialog = ref(false);
const confirmationMessage = ref("");
let pendingAction = null;

const originalDoc = ref(JSON.parse(JSON.stringify(ticket.value.doc)));
const hasChanges = ref(false);
const isCoreFieldBeingUpdated = ref(false);

function handleFieldUpdate(
  fieldname: string,
  value: FieldValue,
  isCoreFieldUpdated = false
) {


  if (ticket.value.doc[fieldname] === value) return;

  ticket.value.doc[fieldname] = value;
  

  if (isCoreFieldUpdated) {
    isCoreFieldBeingUpdated.value = true;
    const label = getField(fieldname)?.label || fieldname;
    notifyTicketUpdate(label, value as string);

    // Directly save the core field update
    ticket.value.setValue.submit({ [fieldname]: value }, {
      onSuccess: () => {
/*         coreFields.value.forEach((section) => {
          section.fields.forEach((f) => {
            if (f.fieldname === fieldname) {
              f.value = value;
            }
          });
        }); */
        originalDoc.value = JSON.parse(JSON.stringify(ticket.value.doc)); // Update originalDoc
        isCoreFieldBeingUpdated.value = false;
      },
    });
  } else {
    customFields.value.forEach((f) => {
      if (f.fieldname === fieldname) {
        f.value = value;
      }
    });
    hasChanges.value = JSON.stringify(ticket.value.doc) !== JSON.stringify(originalDoc.value);
  }
}

function confirmSubmit() {
  confirmationMessage.value = __("Are you sure you want to submit the changes?");
  pendingAction = "submit";
  showConfirmationDialog.value = true;
}

function discardChanges() {
  confirmationMessage.value = __("Are you sure you want to discard the changes?");
  pendingAction = "discard";
  showConfirmationDialog.value = true;
}

function handleConfirmation() {
  if (pendingAction === "submit") {
    // Submit all changes at once
    ticket.value.setValue.submit(ticket.value.doc, {
      onSuccess: () => {
        hasChanges.value = false; // Reset changes after submission
        originalDoc.value = JSON.parse(JSON.stringify(ticket.value.doc)); // Update originalDoc
      },
    });
  } else if (pendingAction === "discard") {
    hasChanges.value = false; // Reset changes after discarding
    cancelConfirmation();
  }
  showConfirmationDialog.value = false;


}

function cancelConfirmation() {
  // reset ticket.doc to originalDoc
  Object.keys(ticket.value.doc).forEach((key) => {
    ticket.value.doc[key] = originalDoc.value[key];
  });
  // reset customFields values to originalDoc values
  customFields.value.forEach((f) => {
    f.value = originalDoc.value[f.fieldname];
  });
}

function updateTicket(ticket) {

  // open UpdateTicketDialog
 /*  const dialog = createDialog(UpdateTicketDialog, {
    props: {
      ticket,
    },
  });
  dialog.show(); */

}
</script>

<style scoped>
:deep(.form-control-core button) {
  font-size: 1rem;
  border-radius: 0.5rem;
  height: 1.75rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  border: 1px solid #e5e7eb; /* outline-gray-2 */
  background-color: #fff; /* surface-white */
  color: #374151; /* ink-gray-8 */
  width: 100%;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}
:deep(.form-control-core button::placeholder) {
  color: #9ca3af; /* ink-gray-4 */
}
:deep(.form-control-core button:hover) {
  border-color: #d1d5db; /* outline-gray-3 */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}
:deep(.form-control-core button:focus) {
  background-color: #fff;
  border-color: #9ca3af; /* outline-gray-4 */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  outline: none;
}
:deep(.form-control-core button:focus-visible) {
  outline: none;
}
:deep(.form-control-core button) {
  color-scheme: dark;
}
:deep(.form-control-core button > div) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.form-control-core div) {
  width: 100%;
  display: flex;
}
</style>
