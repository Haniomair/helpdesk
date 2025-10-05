import { createResource } from "frappe-ui";
import { ref, reactive, onMounted } from "vue";

const templateMap = reactive({});


export const useTicketTemplate = async (templateName, include_default_fields) => {


  if (templateMap[templateName]) {
    return templateMap[templateName];
  }

    try {
        const params = new URLSearchParams({
            name: templateName || "Default",
            include_default_fields: include_default_fields || false,
        });
        const response = await fetch(
            `/api/method/helpdesk.helpdesk.doctype.hd_ticket_template.api.get_one`,
            {method: 'POST', body: params}
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        templateMap[templateName] = result.message;
    } catch (err) {
        console.error(err);
        templateMap[templateName] = null;
    }

    return templateMap[templateName];
 
}