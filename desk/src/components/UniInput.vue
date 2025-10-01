<template>

  <div class="space-y-1.5" v-show="field.display_via_depends_on">
    <span class="block text-sm text-gray-700">
      {{ __(field.label) }}
      <!--       <span v-if="field.required" class="place-self-center text-red-500">
        *
      </span> -->
      <span v-if="field.validationMessage">
        <Tooltip :text="__(field.validationMessage)" :placement="'top'">
          <lucide-info class="inline ms-1 h-4 w-4 text-red-500" />
        </Tooltip>
      </span>
    </span>
    <div
      
      v-if="field.read_only == 1">
      {{ transValue }}
    </div>
    <component v-else :is="component" :placeholder="placeholder"
      :class="field.fieldtype == 'Phone' ? 'ticket-field-phone' : ''" :value="transValue"
      :disabled="field.disabled"
      v-maska:transValue="field.fieldtype == 'Phone' ? '+966-5########' : ''"
      :dir="field.fieldtype === 'Phone' ? 'ltr' : ''" @update:model-value="emitUpdate(field.fieldname, $event)" @change="
        emitUpdate(
          field.fieldname,
          $event.target?.value || $event.value || $event
        )
      ">



    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, h, defineExpose,ref } from "vue";
import { Autocomplete, Link } from "@/components";
import { Field } from "@/types";
import { createResource, FormControl } from "frappe-ui";
import { vMaska  } from "maska/vue";
import LucideInfo from '~icons/lucide/info';



type Value = string | number | boolean;

interface P {
  field: Field;
  value: Value;
}

interface R {
  fieldname: Field["fieldname"];
  value: Value;
}

interface E {
  (event: "change", value: R);
}

const props = defineProps<P>();
const emit = defineEmits<E>();

const component = computed(() => {
  if (props.field.url_method) {
    return h(Autocomplete, {
      options: apiOptions.data,
      size: "sm",
    });
  } else if (props.field.fieldtype === "Link" && props.field.options) {
    return h(Link, {
      doctype: props.field.options,
      filters: props.field.filters,
      advanced_filters: true,
      filter_based_on: props.field.filter_based_on,
      link_hide_from_customer_field: props.field.link_hide_from_customer_field,
    });
  } else if (props.field.fieldtype === "Select") {
    return h(Autocomplete, {
      options: props.field.options
        .split("\n")
        .map((o) => ({ label: __(o), value: o })),
      size: "sm",
    });
  } else if (props.field.fieldtype === "Check") {
    return h(Autocomplete, {
      options: [
        {
          label: __("Yes"),
          value: 1,
        },
        {
          label: __("No"),
          value: 0,
        },
      ],
      size: "sm",
    });
  } else {
    return h(FormControl);
  }
});

const apiOptions = createResource({
  url: props.field.url_method,
  auto: !!props.field.url_method,
  transform: (data) =>
    data?.map((o) => ({
      label: __(o),
      value: o,
    })) || [],
});


/* const transValue = computed({
  get() {
    if (props.field.fieldtype === "Check") {
      return props.value ? __("Yes") : __("No");
    }
    return props.value;
  },
  set(value: Value) {
    //props.value = value;
    emitUpdate(props.field.fieldname, value);
  },
}) */

const transValue = computed(() => {
  //if (props.field.fieldtype === "Check") {
  //  return props.value ? __("Yes") : __("No");
  //}
  return props.value;
});


defineExpose({ transValue });


const placeholder = computed(() => {
  if (props.field.placeholder) {
    return props.field.placeholder;
  }
  if (props.field.fieldtype === "Data" && !props.field.url_method) {
    return __("Type something");
  } else if (props.field.fieldtype === "Phone") {
    return "+966-5xxxxxxxx";
  } else if (props.field.fieldtype === "Email") {
    return "example@example.com";
  }
  return __("Select an option");
});

function emitUpdate(fieldname: Field["fieldname"], value: Value) {
 // if (props.field.fieldtype === "Check") {
 //   value = value === 'true' ? value = true : false;
 // }
  emit("change", { fieldname, value });
}
</script>
