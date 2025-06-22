import frappe
from frappe.translate import get_all_translations


@frappe.whitelist(allow_guest=True)
def get_translations():
    lang = frappe.form_dict.get("lang", None)
    if lang:
        language = lang
    else:
        if frappe.session.user != "Guest":
            language = frappe.db.get_value("User", frappe.session.user, "language")
        else:
            language = frappe.db.get_single_value("System Settings", "language")

    return get_all_translations(language)


@frappe.whitelist(allow_guest=True)
def get_languages():
    """
    Returns a list of all available languages.
    """
    return frappe.get_all(
        "Language",
        fields=["name", "language_name", "flag"],
        filters={"enabled": 1},
        order_by="language_name asc",
    )