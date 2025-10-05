<template>

  <div class="flex-1 flex flex-col" style="height: calc(100vh - 122px);">

    <!-- User avatar with buttons -->
    <TicketContact class="px-3" />

    <div class="pb-4 flex-1 overflow-y-auto">


      <div class="px-3 scrollbar-thin overflow-y-auto" v-if="fieldsInitialized == true">

        <AssignTo class="mb-3" />


        <div v-for="field in coreFields" :key="field.fieldname" :class="'mb-3'">
          <Link v-if="field.visible" :key="field.fieldname" class="form-control-core w-full" :page-length="10"
            :label="field.label" :placeholder="field.placeholder" :doctype="field.options" :modelValue="ticket.doc[field.fieldname]"
            :required="field.required" @update:model-value="(val:string) => handleFieldUpdate(field.fieldname, val,true)" />
        </div>

        <!-- Assignee component -->

        <hr class="mt-2 mb-3 border-outline-gray-2" />

        <div class="flex items-center text-base leading-5 gap-3 mb-5" v-for="field in customFields">
          <span class="w-[126px] text-sm text-gray-600">{{ __(field.label) }}</span>
          <span v-if="field.fieldtype === 'Check'">
            {{ ticket.doc[field.fieldname] != null ? ticket.doc[field.fieldname] ? __('Yes') : __('No') : "-" }}
          </span>
          <span v-else :dir="getDirection() == 'rtl' && field.fieldtype == 'Phone' ? 'ltr' : ''"
            :class="'text-base text-gray-800 flex-1 ' + (field.fieldtype === 'Phone' && getDirection() == 'rtl' ? 'text-end ' : '') + (!ticket.doc[field.fieldname] && ' text-ink-gray-4')">
            {{ ticket.doc[field.fieldname + '@title'] ? __(ticket.doc[field.fieldname + '@title']) || "-" :
            ticket.doc[field.fieldname] != null ? __(ticket.doc[field.fieldname]) : "-" }}
          </span>
        </div>


      </div>
    </div>


    <div class="flex justify-between gap-3 border-t p-4 md:py-2.5">

      <Button ref="sendEmailRef" variant="ghost" :label="__('Update')"
        @click="updateTicket(ticket.value)">
        <template #prefix>
          <EditIcon class="h-4" />
        </template>
      </Button>

<!--       <button
        class="px-4 h-[30px] w-full leading-none rounded font-medium border-0 border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100 transition-colors shadow-none"
        @click="updateTicket(ticket.value)">
        {{ __('Update') }}
      </button> -->

    </div>

    <!--     <div class="border-t flex gap-2 justify-end p-2 pb-5 mb-[31px]" v-if="hasChanges && !isCoreFieldBeingUpdated">
      <button
        class="bg-blue-100 text-blue-800 px-4 h-[35px] leading-none py-2 rounded hover:bg-blue-200  transition-colors font-medium border border-blue-300"
        @click="confirmSubmit">{{ __('Save') }}</button>
      <button
        class="bg-gray-100 text-gray-800 px-4 h-[35px] leading-none py-2 rounded hover:bg-gray-200 transition-colors font-medium border border-gray-300"
        @click="discardChanges">{{ __('Cancel') }}</button>
      <ConfirmationDialog v-if="showConfirmationDialog" :message="confirmationMessage" @confirm="handleConfirmation"
        @cancel="cancelConfirmation" />
    </div> -->

    <UpdateTicketDialog v-if="showUpdateDialog" :ticket="ticket" @cancel="showUpdateDialog = false" @confirm="showUpdateDialog = false" />

  </div>



</template>

<script setup lang="ts">
import { Link } from "@/components";
import { parseField } from "@/composables/formCustomisation";
import { useNotifyTicketUpdate } from "@/composables/realtime";
import { getDirection } from "@/languages";
import { EditIcon } from "@/components/icons/";
import {
  FieldValue,
  TicketSymbol,
} from "@/types";
import { inject, ref,  isRef, reactive, watch } from "vue";
//import TicketField from "../TicketField.vue";
import AssignTo from "./AssignTo.vue";
import TicketContact from "./TicketContact.vue";
import UpdateTicketDialog from "../UpdateTicketDialog.vue";
import { Button } from "frappe-ui";
import { __ } from "@/translation";
const ticket = inject(TicketSymbol);
//const assignees = inject(AssigneeSymbol);
//const customizations = inject(CustomizationSymbol);
//let getFields, getField;
const { notifyTicketUpdate } = useNotifyTicketUpdate(ticket.value?.name);

import { useTicketTemplate } from "@/composables/useTicketTemplate";

let template = reactive(null);

watch(
  () => ticket,
  async (newVal) => {
    if (newVal) {

      template = await useTicketTemplate(newVal.value?.template || "Default",true);
      await initializedCoreFields();
      await initializeCustomFields();
      fieldsInitialized.value = true;

    }
  },
  { immediate: true }
);

/* const template = createResource({
  url: "helpdesk.helpdesk.doctype.hd_ticket_template.api.get_one",
  makeParams: () => ({
    name: "Default",
    include_default_fields: true,
  }),
  auto: true,
  onSuccess: async (data) => {
    await initializedCoreFields();
    await initializeCustomFields()
    fieldsInitialized.value = true;
  },
}); */



const fieldsInitialized = ref(false);

function getField(fieldname: string) {
  // print the stack trace
  return template.fields.find(f => f.fieldname === fieldname);
}

// ticket_type, priority, customer, agent_group
const coreFields = ref([]);
async function initializedCoreFields() {
  // TODO: to confirm whether customizations should apply to core fields as well
  //const fieldsMeta = await getFields();

  //if (!fieldsMeta || fieldsMeta.length === 0) {
  //  return [];
  //}
/*   const _coreFields = [
    //{ group: true, fields: [getField("priority")] },
    getField("customer"),
    getField("agent_group"),
  ];
 */

 const _coreFields = [];

  template.default_fields.forEach((f) => {
      f = parseField(f, ticket.value.doc, true);
      // cant handle required depends on as we directly set the value in DB on change
      f["required"] = f.reqd;
      f["visible"] = true;
      _coreFields.push(f);
  });

  template.fields.filter(x=> x.is_core == 1).forEach((f) => {
      f = parseField(f, ticket.value.doc, true);
      // cant handle required depends on as we directly set the value in DB on change
      f["required"] = f.reqd;
      f["visible"] = true;
      _coreFields.push(f);
  });



  coreFields.value = _coreFields;
};




const customFields = ref([])

async function initializeCustomFields() {


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
  let _fields = template.fields.filter((f) => !_coreFields.includes(f.fieldname));
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

/* function getFieldInFormat(fieldTemplate, fieldMeta) {
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
 */


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
  console.log("is ref", isRef(ticket.value.doc))
  console.log(ticket.value.doc[fieldname]);

  let f = coreFields.value.find(f => f.fieldname === fieldname);
  f.value = value;

  //return;
  console.log(ticket.value.doc);

  if (isCoreFieldUpdated) {
    
    isCoreFieldBeingUpdated.value = true;
    const label = getField(fieldname)?.label || fieldname;
    notifyTicketUpdate(label, value as string);

    fetch(`/api/resource/HD Ticket/${ticket.value.doc.name}`, {
      method: "PUT",
      body: JSON.stringify({
        [fieldname]: value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json())
      .then((data) => {
        if (data.data) {
          ticket.value.doc[fieldname] = value;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    }
  }
    // Directly save the core field update
    //ticket.value.setValue.submit({ [fieldname]: value }, {
    //  onSuccess: () => {
/*         coreFields.value.forEach((section) => {
          section.fields.forEach((f) => {
            if (f.fieldname === fieldname) {
              f.value = value;
            }
          });
        }); */
        //originalDoc.value = JSON.parse(JSON.stringify(ticket.value.doc)); // Update originalDoc
    //    isCoreFieldBeingUpdated.value = false;
    //  },
    //});
  //}
  // else {
  //  customFields.value.forEach((f) => {
  //    if (f.fieldname === fieldname) {
  //      f.value = value;
  //    }
  //  });
  //  hasChanges.value = JSON.stringify(ticket.value.doc) !== JSON.stringify(originalDoc.value);
  //}
//}

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


const showUpdateDialog = ref(false);
function updateTicket(ticket) {

  // open UpdateTicketDialog
  showUpdateDialog.value = true;
 
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
