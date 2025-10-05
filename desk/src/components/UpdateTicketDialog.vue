<template>
    <div class="dialog-overlay" @click.self="onCancel">

         

        <div class="dialog-box">



        <div class="flex items-between border-b p-4 w-full">
            <h2 class="dialog-title">#{{ ticket.doc.subject }}</h2>
            <button class="ml-auto rtl:ml-0 rtl:mr-auto" @click="onCancel">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>




            <div class="grid grid-cols-1 gap-3 overflow-y-auto p-4 h-[35em]">


                <template v-for="field in fields" :key="field.fieldname">


<!--                     <UniInput :field="field" :value="templateFields[field.fieldname]"
                        @change="(e) => handleOnFieldChange(e, field.fieldname, field.fieldtype)" /> -->

                        <TicketField v-if="field.display_via_depends_on" :field="field"
                             :value="templateFields[field.fieldname]" @change="({ fieldname, value }) => handleOnFieldChange(value, fieldname)" />

                </template>

            </div>

            <div class="dialog-actions border-t p-4">
                <Button theme="gray" class="me-2" v-if="hasChanges"  variant="solid" @click="onConfirm">{{ __('Update') }}</Button>
                <Button theme="gray" variant="outline" @click="onCancel">{{ __('Cancel') }}</Button>
            </div>

        </div>

    </div>

</template>

<script setup lang="ts">
import { defineEmits, watch, ref, computed, onMounted } from 'vue';
import { useTicketTemplate } from "@/composables/useTicketTemplate";
import {
    parseField
} from "@/composables/formCustomisation";

import { Button } from "frappe-ui"
import TicketField from './TicketField.vue';

const template = ref(null);
const templateFields = ref({})
const fieldsInitialized = ref(false);
const fields = ref([])



onMounted(async ()=> {
    template.value = await useTicketTemplate(props.ticket.doc.template);
    fields.value = template.value.fields.filter(f=> f.is_core == false).map(f => parseField(f, templateFields.value)).sort((a, b) => a.idx - b.idx);
    await setupTemplateFields()
    fieldsInitialized.value = true;
})

const emit = defineEmits(['confirm', 'cancel']);
const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  },
});


function setupTemplateFields() {
    fields.value.forEach((field: any) => {
        templateFields.value[field.fieldname] = ref(props.ticket.doc[field.fieldname]);
    });
}
 
const hasChanges = computed(() => {
    return Object.keys(templateFields.value).some(key => {
        return templateFields.value[key] !== props.ticket.doc[key];
    });
});

function handleOnFieldChange(value: any, fieldname: string) {
    templateFields.value[fieldname] = value;
}


function onConfirm() {
   
    console.log(props.ticket)

    // pass the updated fields to parent component
    fetch(`/api/resource/HD Ticket/${props.ticket.doc.name}`, {
        method: "PUT",
        body: JSON.stringify(templateFields.value),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((response) => response.json())
        .then((data) => {
            if (data.data) {
                // update the ticket data
                Object.keys(templateFields.value).forEach(fieldname => {
                    props.ticket.doc[fieldname] = templateFields.value[fieldname];
                });
                props.ticket.reload();
                emit('confirm');
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}
  

function onCancel() {


    // reset everything
    templateFields.value = {};
    fields.value = [];
    fieldsInitialized.value = false;

  emit('cancel');
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: auto;
}
.dialog-box {
  background: #fff;
  border-radius: 8px;
  /* padding: 1.5rem 1.5rem; */
  min-width: 320px;
  width: 80em;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
}
.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.dialog-message {
  margin-bottom: 1.5rem;
}
.dialog-actions {
  display: flex;
  justify-content: end;
  gap: 4px;
}



</style>
