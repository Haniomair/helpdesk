from typing import Literal

import frappe

# from frappe import _
from pypika import JoinType

from helpdesk.helpdesk.doctype.hd_form_script.hd_form_script import get_form_script
from helpdesk.utils import check_permissions

DOCTYPE_TEMPLATE = "HD Ticket Template"
DOCTYPE_TEMPLATE_FIELD = "HD Ticket Template Field"
DOCTYPE_TICKET = "HD Ticket"


@frappe.whitelist()
def get_one(name: str, include_default_fields: bool=False):
    check_permissions(DOCTYPE_TEMPLATE, None)
    found, about, description_template = frappe.get_value(
        DOCTYPE_TEMPLATE, name, ["name", "about", "description_template"]
    ) or [None, None, None]
    if not found:
        return {"about": None, "fields": []}

    fields = get_fields_meta(name, include_default_fields)
    default_fields = []
    if include_default_fields:
        default_fields = get_default_fields()

    return {
        "about": about,
        "fields": fields,
        "default_fields": default_fields,
        "description_template": description_template,
        "_form_script": get_form_script(
            "HD Ticket", apply_on_new_page=True, is_customer_portal=False
        ),
    }

def get_fields_for_agent(template: str):
    fields = get_fields(template, "DocField")
    fields = sorted(fields, key=lambda x: x.idx)
    return fields

def get_default_fields():
    default_fields = ['customer', 'agent_group']
    DocField = frappe.qb.DocType("DocField")
    fields = (
        frappe.qb.from_(DocField)
        .select(DocField.fieldname, 
                DocField.label, 
                DocField.fieldtype, 
                DocField.options, 
                DocField.description, 
                DocField.idx,
                DocField.read_only,
                DocField.depends_on,
                DocField.mandatory_depends_on
                )
        .where(DocField.parent == "HD Ticket")
        .where(DocField.fieldname.isin(default_fields))
        .orderby(DocField.idx)
        .run(as_dict=True)
    )
    return fields

def get_fields_meta(template: str, include_default_fields: bool = False):
    fields = get_fields(template, "DocField")
    fields.extend(get_fields(template, "Custom Field"))
    if include_default_fields:
        # exclude default fields that are already in template
        existing_fieldnames = {field['fieldname'] for field in fields}
        default_fields = [field for field in get_default_fields() if field['fieldname'] not in existing_fieldnames]
        fields.extend(default_fields)
    fields = sorted(fields, key=lambda x: x.idx)
    return fields


def get_fields(template: str, fetch: Literal["Custom Field", "DocField"]):
    QBField = frappe.qb.DocType(DOCTYPE_TEMPLATE_FIELD)
    QBFetch = frappe.qb.DocType(fetch)
    fields = (
        frappe.qb.from_(QBField)
        .select(QBField.star)
        .where(QBField.parent == template)
        .where(QBField.parentfield == "fields")
        .where(QBField.parenttype == DOCTYPE_TEMPLATE)
    )
    where_parent = QBFetch.parent == DOCTYPE_TICKET
    if fetch == "Custom Field":
        where_parent = QBFetch.dt == DOCTYPE_TICKET
    result = (
        frappe.qb.from_(fields)
        .select(
            QBFetch.description,
            QBFetch.fieldtype,
            QBFetch.label,
            QBFetch.options,
            QBFetch.link_filters,
            QBFetch.depends_on,
            QBFetch.mandatory_depends_on,
            fields.fieldname,
            fields.hide_from_customer,
            fields.link_hide_from_customer_field,
            fields.required,
            fields.url_method,
            fields.placeholder,
            fields.idx,
            fields.read_only
        )
        .join(QBFetch, JoinType.inner)
        .on(QBFetch.fieldname == fields.fieldname)
        .where(where_parent)
        .orderby(fields.idx)
        .run(as_dict=True)
    )
    docfields = ["link_filters", "depends_on", "mandatory_depends_on"]

    for df in docfields:
        for field in result:
            property_setter_id = "HD Ticket" + "-" + field.fieldname + "-" + df
            if frappe.db.exists("Property Setter", property_setter_id):
                field[df] = frappe.get_value(
                    "Property Setter", property_setter_id, "value"
                )
    return result
