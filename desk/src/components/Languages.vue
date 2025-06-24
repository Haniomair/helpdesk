<template>
    <Popover placement="right-start" class="flex w-full">
      <template #target="{ togglePopover }">
        <button
          :class="[
            'group w-full flex h-7 items-center justify-between rounded px-2 text-base text-gray-800 hover:bg-gray-100',
          ]"
          @click.prevent="togglePopover()"
        >
          <div class="flex gap-2">
            <GlobIcon />
            <span class="whitespace-nowrap">{{ __('Languages') }}</span>
          </div>
          <ChevronRight class="h-4 w-4  rtl:rotate-180 stroke-1.5" />
        </button>
      </template>
      <template #body>
        <div
          class="grid grid-cols-1 justify-between mx-3 p-2 rounded-lg border border-gray-100 bg-white shadow-xl"
        >
          <div v-for="lang in languages.data" key="name">
            <a
              href="#"
               @click="changeLanguage(lang.name)"
              class="flex flex-col gap-1.5 rounded justify-center items-center py-2 px-3 hover:bg-gray-100"
            >
              <div class="text-sm">
                {{ lang.title }}
              </div>
            </a>
          </div>
        </div>
      </template>
    </Popover>
  </template>
  <script setup>

  import { Popover, createResource } from "frappe-ui";
  import GlobIcon from "./icons/GlobIcon.vue";
  import ChevronRight from "~icons/lucide/chevron-right";

  import { getCurrentLanguage, changeLanguage } from "@/languages";
  const currentLanguage = getCurrentLanguage();
  
  
  const languages = createResource({
    url: "helpdesk.api.get_languages",
    cache: "languages",
    auto: true,
    transform: (data) => {
      let _langs = [];
      data.map((lang) => {
        if (currentLanguage === lang.name) return;
        _langs.push({
          name: lang.name,
          flag: lang.flag,
          title: lang.language_name,
        });
      });
      return _langs;
    },
  });


  </script>
  