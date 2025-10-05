<template>
  <div class="flex gap-1">
    <Tooltip
      :text="
        getPreviousTicket()
          ? `${__('Go to previous ticket')}: #${getPreviousTicket()}`
          : __('No previous ticket')
      "
      :disabled="disableLeftCondition"
    >
      <Button
        :icon="getDirection() == 'rtl' ? LucideChevronRight : LucideChevronLeft"
        variant="ghost"
        :disabled="disableLeftCondition"
        @click="goToPreviousTicket()"
      />
    </Tooltip>
    <Tooltip
      :text="
        getNextTicket()
          ? `${__('Go to next ticket')}: #${getNextTicket()}`
          : __('No next ticket')
      "
      :disabled="disableRightCondition"
    >
      <Button
        :icon="getDirection() == 'rtl' ? LucideChevronLeft : LucideChevronRight"
        variant="ghost"
        :disabled="disableRightCondition"
        @click="goToNextTicket()"
      />
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import {
  ticketsToNavigate,
  useTicketNavigation,
} from "@/composables/useTicketNavigation";
import { computed } from "vue";
import LucideChevronLeft from "~icons/lucide/chevron-left";
import LucideChevronRight from "~icons/lucide/chevron-right";
import { getDirection } from "@/languages"

const {
  currentTicketIndex,
  goToNextTicket,
  goToPreviousTicket,
  getNextTicket,
  getPreviousTicket,
} = useTicketNavigation();

const disableLeftCondition = computed(() => {
  if (ticketsToNavigate.loading || !ticketsToNavigate.data?.length) return true;

  return currentTicketIndex.value == 0;
});

const disableRightCondition = computed(() => {
  if (ticketsToNavigate.loading || !ticketsToNavigate.data?.length) return true;
  if (ticketsToNavigate.data.length <= 1) return true;
  return currentTicketIndex.value >= ticketsToNavigate.data.length - 1;
});
</script>
