import type {
  DocumentResource,
  RecentSimilarTicket,
  Resource,
  ResourceDoc,
  TicketActivities,
  TicketContact,
} from "@/types";
import type { HDTicket } from "@/types/doctypes";
import { createResource } from "frappe-ui";
import { createDocResource } from '@/utils/resources'
import { reactive } from "vue";

interface MapValue {
  ticket: ResourceDoc<HDTicket>;
  assignees: Resource<Record<"name", string>[]>;
  contact: Resource<TicketContact>;
  recentSimilarTickets: Resource<RecentSimilarTicket>;
  activities: Resource<TicketActivities>;
}

const ticketMap: Record<string, MapValue> = reactive({});

export const useTicket = (ticketId: string): MapValue => {
  let err = false;
  if (!ticketMap[ticketId]) {

    ticketMap[ticketId] =
      {
        ticket: 
        createDocResource({
          url: "/api/method/helpdesk.helpdesk.doctype.hd_ticket.api.get_ticket_for_agent",
          params: { name: ticketId },
          auto: true,
          onSuccess: (doc) => {
            console.log("Ticket loaded", doc);
          }
        }),
      /* ticket: createDocumentResource<HDTicket>({
        doctype: "HD Ticket",
        name: ticketId,
        whitelistedMethods: {
          markSeen: "mark_seen",
        },
        onSuccess: (doc) => {
        },
        setValue: {
          onSuccess: () => {
            toast.success(__("Ticket updated"));
            err = false;
          },
          onError: (error) => {
            if (err) return;
            err = true;
            const msg = error.exc_type
              ? (error.messages || error.message || []).join(", ")
              : error.message;
            toast.error(msg);
          },
        },
      }), */
      assignees: createResource({
        url: "helpdesk.helpdesk.doctype.hd_ticket.api.get_ticket_assignees",
        params: { ticket: ticketId },
        auto: true,
        transform: (data: string) => {
          return JSON.parse(data).map((name: string) => ({ name })) as Record<
            "name",
            string
          >[];
        },
      }),
      contact: createResource({
        url: "helpdesk.helpdesk.doctype.hd_ticket.api.get_ticket_contact",
        params: { ticket: ticketId },
        auto: true,
      }),
      recentSimilarTickets: createResource({
        url: "helpdesk.helpdesk.doctype.hd_ticket.api.get_recent_similar_tickets",
        params: { ticket: ticketId },
        auto: true,
      }),
      activities: createResource({
        url: "helpdesk.helpdesk.doctype.hd_ticket.api.get_ticket_activities",
        params: { ticket: ticketId },
        auto: true,
      }),
    };
  } else {


  }

  return ticketMap[ticketId];
};
