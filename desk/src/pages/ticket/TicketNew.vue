<template>
  <div class="flex flex-col overflow-y-auto">
    <LayoutHeader>
      <template #left-header>
        <Breadcrumbs :items="breadcrumbs" />
      </template>
      <template #right-header>
        <CustomActions v-if="template.data?._customActions" :actions="template.data?._customActions" />
      </template>
    </LayoutHeader>
    <!-- Container -->
    <div class="flex flex-col gap-5 py-6 h-full flex-1 self-center overflow-auto mx-auto w-full max-w-4xl px-5">
      <!-- custom fields descriptions -->
      <div v-if="Boolean(template.data?.about)" class="">
        <div class="prose-f" v-html="sanitize(template.data.about)" />
      </div>

      <!-- existing fields -->
      <div class="flex flex-col" :class="(subject.length >= 2 || description.length) && 'gap-5'">
        <div class="flex flex-col gap-2">
          <span class="block text-sm text-gray-700">
            {{ __('Subject') }}
            <span v-if="isEmptyString(subject)">
              <Tooltip :text="__('This field is required')" :placement="'top'">
                <lucide-info class="inline ms-1 h-4 w-4 rounded-full text-red-500" />
              </Tooltip>
            </span>
          </span>
          <FormControl v-model="subject" type="text" :placeholder="__('A short description')" />
        </div>

        <!-- search articles -->
        <SearchArticles v-if="isCustomerPortal && !isEmptyString(subject)" :query="subject" class="shadow" />

      </div>

      <h4 v-if="isCustomerPortal && isEmptyString(subject)" class="text-p-sm text-gray-500 ml-1">
        {{ __('Please enter a subject to continue') }}
      </h4>

      <!-- custom fields -->
      <div v-show="!isCustomerPortal || !isEmptyString(subject)" class="flex flex-col gap-2">

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3" v-if="Boolean(visibleFields)">

          <UniInput v-for="field in visibleFields" :key="field.fieldname" :field="field"
            :value="templateFields[field.fieldname]"
            @change="(e) => handleOnFieldChange(e, field.fieldname, field.fieldtype)" />
        </div>
      </div>

      <!-- description -->
      <div v-if="isCustomerPortal && !isEmptyString(subject)">
        <span class="block text-sm text-gray-700 mb-2">
          {{ __('Details') }}
          <span v-if="$refs.editor != null && $refs.editor.editor.isEmpty">
            <Tooltip :text="__('This field is required')" :placement="'top'">
              <lucide-info class="inline ms-1 h-4 w-4 rounded-full text-red-500" />
            </Tooltip>
          </span>
        </span>
        <TicketTextEditor ref="editor" v-model:attachments="attachments" v-model:content="description"
          :uploadFunction="(file: any) => uploadFunction(file)" :placeholder="__('Detailed explanation')" expand>
          <template #bottom-right>
            <Button :label="__('Submit')" theme="gray" variant="solid" :disabled="canSave === false || ticket.loading"
              @click="() => ticket.submit()" />
          </template>
        </TicketTextEditor>
      </div>

      <!-- for agent portal -->
      <div v-if="!isCustomerPortal">
        <span class="block text-sm text-gray-700 mb-2">
          {{ __('Details') }}
          <span v-if="$refs.editor != null && $refs.editor.editor.isEmpty">
            <Tooltip :text="__('This field is required')" :placement="'top'">
              <lucide-info class="inline ms-1 h-4 w-4 rounded-full text-red-500" />
            </Tooltip>
          </span>
        </span>
        <TicketTextEditor ref="editor" v-model:attachments="attachments" v-model:content="description"
          :placeholder="__('Detailed explanation')" expand>
          <template #bottom-right>
            <Button :label="__('Submit')" theme="gray" variant="solid" :disabled="
                !canSave || ticket.loading
              " @click="() => ticket.submit()" />
          </template>
        </TicketTextEditor>
      </div>
    </div>

    <pre>
  </pre>

  </div>


</template>

<script setup lang="ts">
import { LayoutHeader, UniInput } from "@/components";
import {
  handleLinkFieldUpdate,
  handleSelectFieldUpdate,
  setupCustomizations,
  parseField,
} from "@/composables/formCustomisation";
import { useAuthStore } from "@/stores/auth";
import { globalStore } from "@/stores/globalStore";
import { capture } from "@/telemetry";
import { Field } from "@/types";
import { isCustomerPortal, isEmptyString, uploadFunction } from "@/utils";
import {
  Breadcrumbs,
  Button,
  call,
  createResource,
  FormControl,
  toast,
  usePageMeta,
} from "frappe-ui";
import { useOnboarding } from "frappe-ui/frappe";
import { isEmpty } from "lodash";
import sanitizeHtml from "sanitize-html";
import { computed, onMounted, reactive, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import SearchArticles from "../../components/SearchArticles.vue";
import TicketTextEditor from "./TicketTextEditor.vue";
import { get } from "@vueuse/core";

interface P {
  templateId?: string;
}

const props = withDefaults(defineProps<P>(), {
  templateId: "",
});

//const route = useRoute();
const router = useRouter();
const { $dialog } = globalStore();
const { updateOnboardingStep } = useOnboarding("helpdesk");
const { isManager, userId: userID } = useAuthStore();

const subject = ref("");
const description = ref("");
const attachments = ref([]);
const templateFields = reactive({});
const editor = useTemplateRef("editor");

const template = createResource({
  url: "helpdesk.helpdesk.doctype.hd_ticket_template.api.get_one",
  makeParams: () => ({
    name: props.templateId || "Default",
  }),
  auto: true,
  onSuccess: (data) => {
    description.value = data.description_template || "";
    oldFields = window.structuredClone(data.fields || []);
    setupCustomizations(template, {
      doc: templateFields,
      call,
      router,
      $dialog,
      applyFilters,
    });


    setupTemplateFields(data.fields);
    visibleFields.push(...generateVisibleFields());

  },
});

function setupTemplateFields(fields) {
  fields.sort((a,b)=> a.idx - b.idx).forEach((field: Field) => {
    templateFields[field.fieldname] = "";
  });
}

let oldFields = [];

function applyFilters(fieldname: string, filters: any = null) {
  const f: Field = template.data.fields.find((f) => f.fieldname === fieldname);
  if (!f) return;
  if (f.fieldtype === "Select") {
    handleSelectFieldUpdate(f, fieldname, filters, templateFields, oldFields);
  } else if (f.fieldtype === "Link") {
    handleLinkFieldUpdate(f, fieldname, filters, templateFields, oldFields);
  }
}

const customOnChange = computed(() => template.data?._customOnChange);
let visibleFields = reactive([]);

function generateVisibleFields() {

  let _fields = template.data?.fields?.filter(
    (f) => !isCustomerPortal.value || !f.hide_from_customer
  );
  //return _fields;
  if (!_fields) return [];

  return _fields.map((field) => parseField(field, templateFields));

}


const canSave = computed(() => {

  if (gettingEmployeeData.value) return false;
  return !isEmptyString(subject.value) && editor?.value?.editor.isEmpty === false;
  //return visibleFields.every((f) => (f.display_via_depends_on == true && f.validationMessage === "") || f.display_via_depends_on == false) && !isEmpty(subject.value) && editor?.value?.editor.isEmpty === false;
});
  
  
/*   const visibleFields = computed(() => {
  let _fields = template.data?.fields?.filter(
    (f) => !isCustomerPortal.value || !f.hide_from_customer
  );
  //return _fields;
  if (!_fields) return [];
  return _fields.map((field) => parseField(field, templateFields));
}); */



function handleOnFieldChange(e: any, fieldname: string, fieldtype: string) {

  if (e.value instanceof Event) {
return;
  }
  templateFields[fieldname] = e.value;



  const fieldDependentFns = customOnChange.value?.[fieldname];
  const f: Field = template.data.fields.find((f) => f.fieldname === fieldname);
  if (fieldDependentFns) {
    fieldDependentFns.forEach((fn: Function) => {
      fn(e.value, fieldtype);
    });
  }
}

const ticket = createResource({
  url: "helpdesk.helpdesk.doctype.hd_ticket.api.new",
  debounce: 300,
  makeParams: () => ({
    doc: {
      description: description.value,
      subject: subject.value,
      template: props.templateId,
      ...templateFields,
    },
    attachments: attachments.value,
  }),
  validate: (params) => {
    const fields = visibleFields?.filter((f) => f.required) || [];
    const toVerify = [...fields, "subject", "description"];
    for (const field of toVerify) {
      if (isEmpty(params.doc[field.fieldname || field])) {
        return `${field.label || field} is required`;
      } visibleFields
    }
  },
  onSuccess: (data) => {
    router.push({
      name: isCustomerPortal.value ? "TicketCustomer" : "TicketAgent",
      params: {
        ticketId: data.name,
      },
    });
    if (isManager) {
      updateOnboardingStep("create_first_ticket", true, false, () =>
        localStorage.setItem("firstTicket", data.name)
      );
    }
    // only capture telemetry for customer portal
    if (isCustomerPortal.value) {
      capture("new_ticket_submitted", {
        data: {
          user: userID,
          ticketID: data.name,
          subject: subject.value,
          description: description.value,
          customFields: templateFields,
        },
      });
    }
  },
});

function sanitize(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
  });
}

const breadcrumbs = computed(() => {
  const items = [
    {
      label: __("Tickets"),
      route: {
        name: isCustomerPortal.value ? "TicketsCustomer" : "TicketsAgent",
      },
    },
    {
      label: __("New Ticket"),
      route: {
        name: "TicketNew",
      },
    },
  ];
  return items;
});

usePageMeta(() => ({
  title: __("New Ticket"),
}));

const gettingEmployeeData = ref(false);

onMounted(() => {
  if (isCustomerPortal.value) {
    gettingEmployeeData.value = true;
    call("itsm.customizations.utils.get_employee_id_mobile_from_server_tb",
      { user: userID },
      { method: "GET" }
    )
    
      .then((data) => {
        
        toast.success(
          __("Employee data fetched successfully")
        );

        templateFields["custom_employee_id"] = data.employee_id || "";
        templateFields["custom_employee_mobile"] = data.employee_mobile || "";
        templateFields["custom_employee_name"] = data.first_name || userID;
        
      })
      .catch((error) => {
        toast.error(
          __("Error fetching employee data.")
        );
        console.error("Error fetching employee data:", error);
      })
      .then(() => {
        gettingEmployeeData.value = false;
      });

  }
  capture("new_ticket_page", {
    data: {
      user: userID,
    },
  });
});
</script>
