<template>
  <div class="space-y-1.5">


    <span class="block overflow-hidden text-ellipsis whitespace-nowrap text-base leading-5 py-1 px-2 "
      :class="!simpleFilterMessageStyle ? 'rounded h-7 border border-gray-100 bg-gray-100 w-full' : ''"
      v-if="options.loading">{{ __('Loading...') }}</span>


    <label class="block" :class="labelClasses" v-else-if="attrs.label">
      {{ attrs.label }}
    </label>



    <div v-show="!options.loading && (options.fetched === true || modelValue == '')">
      <Autocomplete ref="autocomplete" :options="options.data" v-model="value" :size="attrs.size || 'sm'"
        :variant="attrs.variant" :placeholder="attrs.placeholder" :filterable="false">
        <template #target="{ open, togglePopover }">
          <slot name="target" v-bind="{ open, togglePopover }" />
        </template>

        <template #prefix>
          <slot name="prefix" />
        </template>

        <template #item-prefix="{ active, selected, option }">
          <slot name="item-prefix" v-bind="{ active, selected, option }" />
        </template>

        <template #item-label="{ active, selected, option }">
          <slot name="item-label" v-bind="{ active, selected, option }">
            <div v-if="option.description && showDescription" class="flex flex-col gap-1">
              <div class="flex-1 font-semibold truncate text-ink-gray-7">
                {{ __(option.label) }}
              </div>
              <div class="flex-1 text-sm truncate text-ink-gray-5">
                {{ option.description }}
              </div>
            </div>
            <div v-else class="flex-1 truncate text-ink-gray-7">
              {{ __(option.label) }}
            </div>
          </slot>
        </template>

        <template #footer="{ value, close }" v-if="!hideClearButton">
          <div v-if="attrs.onCreate">
            <Button variant="ghost" class="w-full !justify-start" :label="__('Create New')"
              @click="attrs.onCreate(value, close)">
              <template #prefix>
                <FeatherIcon name="plus" class="h-4" />
              </template>
            </Button>
          </div>
          <div>
            <Button variant="ghost" class="w-full !justify-start" :label="__('Clear Selection')"
              @click="() => clearValue(close)">
              <template #prefix>
                <FeatherIcon name="x" class="h-4" />
              </template>
            </Button>
          </div>
        </template>
      </Autocomplete>
    </div>
  </div>
</template>

<script setup>
import { useAttrs, computed, ref, onMounted } from "vue";
import { createResource } from "frappe-ui";
import Autocomplete from "./Autocomplete.vue";
import { watchDebounced } from "@vueuse/core";
import { watch } from "vue";

const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  filters: {
    type: Array,
    default: [],
  },
  filter_based_on: {
type: Object,
default :[]
  },
  advanced_filters: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: "",
  },
  hideMe: {
    type: Boolean,
    default: false,
  },
  pageLength: {
    type: Number,
    default: 10,
  },
  hideClearButton: {
    type: Boolean,
    default: false,
  },
  showDescription: {
    type: Boolean,
    default: false,
  },
  simpleFilterMessageStyle: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const attrs = useAttrs();

const valuePropPassed = computed(() => "value" in attrs);

const value = computed({
  get: () => (valuePropPassed.value ? attrs.value : props.modelValue),
  set: (val) => {
    return (
      val?.value &&
      emit(valuePropPassed.value ? "change" : "update:modelValue", val?.value)
    );
  },
});

const autocomplete = ref(null);
const text = ref("");
const reloadingOnFiltersChange = ref(false);


watchDebounced(
  () => autocomplete.value?.query,
  (val) => {
    val = val || "";
    if (text.value === val) return;
    text.value = val;
    reload(val);
  },
  { debounce: 300, immediate: true }
);

watchDebounced(
  () => props.doctype,
  () => reload(""),
  { debounce: 300, immediate: true }
);


 watch(
  ()=> props?.filters,
  () => {
    clearValue();
    options.data = [];
    options.update({
      params: {
        txt: text.value,
        doctype: props.doctype,
        filters: getFilters(props.filters),
        page_length: 100,
      },
    });
    reloadingOnFiltersChange.value = true;
    options.reload();
  },
  { deep: true }
);

var options = createResource({
  url: "frappe.desk.search.search_link",
  cache: [props.doctype + '' + Date.now(), text.value, props.hideMe],
  method: "POST",
  params: {
    txt: text.value,
    doctype: props.doctype,
    filters: getFilters(props.filters),
    page_length: 100,
  },
  validate(params) {


    // TODO: Impelement better way to stop the request if filters not set
    if (props.filter_based_on?.length > 0 && props.filters.some(f => !Boolean(f.function) && !f.function)) {
      return ' ';
    }

  },
  transform: (data) => {
    let allData = data.map((option) => {
      return {
        value: option.value,
        label: option?.label || option.value,
        description: option?.description,
      };
    });

    if (
      !props.hideMe &&
      (props.doctype == "User" || props.doctype == "HD Agent")
    ) {
      allData.unshift({
        label: "@me",
        value: "@me",
      });
    }
    return allData;
  },
  onSuccess: (data) => {
    reloadingOnFiltersChange.value = false;
  },
  onError: (error) => {
    reloadingOnFiltersChange.value = false;
  }
});

function reload(val) {
  if (
    options.data?.length &&
    val === options.params?.txt &&
    props.doctype === options.params?.doctype
  )
    return;

  options.update({
    params: {
      txt: val,
      doctype: props.doctype,
      filters: getFilters(props.filters),
      page_length: 100,
    },
  });
  options.reload();
}

function clearValue(close) {
  emit(valuePropPassed.value ? "change" : "update:modelValue", "");
  if (close != undefined) close();
}

function getFilters(filters) {
  if (!filters)
  return null;
    
  if (!props.advanced_filters)
  return filters;

return filters.map(f=> {
  return [f.doctype,f.field,f.operator,f.function];
});
}



const labelClasses = computed(() => {
  return [
    {
      sm: "text-xs",
      md: "text-base",
    }[attrs.size || "sm"],
    "text-gray-600",
  ];
});
</script>
