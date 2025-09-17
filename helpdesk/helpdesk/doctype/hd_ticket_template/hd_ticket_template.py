# Copyright (c) 2022, Frappe Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from helpdesk.consts import DEFAULT_TICKET_TEMPLATE


class HDTicketTemplate(Document):
    def validate(self):
        self.verify_field_exists()
        self.validate_unallowed_fields()

    def on_trash(self):
        self.prevent_default_delete()

    def verify_field_exists(self):
        for f in self.fields:
            if not f.fieldname:
                continue
            exists = self.docfield_exists(f.fieldname) or self.custom_field_exists(
                f.fieldname
            )
            if not exists:
                text = _("Field `{0}` does not exist in Ticket").format(f.fieldname)
                frappe.throw(text)

            hide_from_customer_field = f.get("link_hide_from_customer_field")
            if not hide_from_customer_field or not hide_from_customer_field.strip():
                return
            if field.options and field.fieldtype == "Link":
                exists = self.docfield_exists(hide_from_customer_field, field.options) or self.custom_field_exists(hide_from_customer_field, field.options)
                if not exists:
                    text = _("Hide from customer field `{0}` does not exist or it is not a Check field. Field name: {1}, DocType: {2}").format(hide_from_customer_field, f.fieldname, field.options)
                    frappe.throw(text)
                

    def get_field(self, fieldname: str):
        field = frappe.db.get_value(
            "DocField",
            {"fieldname": fieldname, "parent": "HD Ticket"},
            ["fieldtype", "options"],
            as_dict=True
        )
        if not field:
            field = frappe.db.get_value(
                "Custom Field",
                {"fieldname": fieldname, "dt": "HD Ticket"},
                ["fieldtype", "options"],
                as_dict=True
            )

        return field or None



    def docfield_exists(self, fieldname: str, parent: str = "HD Ticket"):
        return frappe.db.exists(
            {
                "doctype": "DocField",
                "fieldname": fieldname,
                "fieldtype": "Check",
                "parent": parent,
            }
        )

    def validate_unallowed_fields(self):
        unallowed_fields = ["status", "agreement_status"]
        for f in self.fields:
            if f.fieldname in unallowed_fields:
                text = _("Field `{0}` is not allowed in Ticket Template").format(
                    f.fieldname
                )
                frappe.throw(text)

    def custom_field_exists(self, fieldname: str):
        return frappe.db.exists(
            {
                "doctype": "Custom Field",
                "fieldname": fieldname,
                "fieldtype": "Check",
                "dt": parent,
            }
        )

    def prevent_default_delete(self):
        if self.name == DEFAULT_TICKET_TEMPLATE:
            text = _("Default template can not be deleted")
            frappe.throw(text, frappe.PermissionError)
