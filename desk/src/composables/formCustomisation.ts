import { Field } from "@/types";
import { reactive, computed } from "vue";
import { isEmptyString } from "@/utils";

export async function setupCustomizations(doc, obj) {
  let data = doc?.data;
  if (!data) return;
  if (!data._form_script) return [];
  let actions = [];
  let onChangeFieldMap = {};
  if (Array.isArray(data._form_script)) {
    for (const script of data._form_script) {
      const parsed = await parseScript(script, obj);
      actions = actions.concat(parsed.actions);
      if (parsed.onChange) {
        parseOnChangeFn(onChangeFieldMap, parsed.onChange);
      }
    }
  } else {
    const parsed = await parseScript(data._form_script, obj);
    actions = parsed.actions;
    if (parsed.onChange) {
      parseOnChangeFn(onChangeFieldMap, parsed.onChange);
    }
  }
  data._customActions = actions;
  if (Object.keys(onChangeFieldMap).length) {
    data._customOnChange = onChangeFieldMap;
  }
}

function parseOnChangeFn(fieldMap: object, currentField: object) {
  for (const [key, value] of Object.entries(currentField)) {
    if (!fieldMap[key]) {
      fieldMap[key] = new Set();
    }
    fieldMap[key].add(value);
  }
}

async function parseScript(script, obj) {
  const scriptFn = new Function(script + "\nreturn setupForm")();
  const formScript = await scriptFn(obj);
  return {
    actions: formScript?.actions || [],
    onChange: formScript?.onChange || null,
  };
}

export function handleSelectFieldUpdate(
  f: Field,
  fieldname: string,
  filters: any,
  doc: any,
  oldDoc: any
) {
  if (!filters) {
    f.options = oldDoc.find((f) => f.fieldname === fieldname).options;
  } else {
    f.options = filters.join("\n");
  }

  // reset dependent field
  doc[fieldname] = "";
}

export function cascadeFilterChanges(fieldname,fields, templateFields) {


  let fieldsWithFilter = fields.filter(
    (f) => f.filter_based_on.includes(fieldname)
  );
  

  fieldsWithFilter.forEach(f => {
    templateFields[f.fieldname] = null;
    evaluateFilter(f, templateFields);
    cascadeFilterChanges(f.fieldname,fields,templateFields);
  });

}

export function handleLinkFieldUpdate(
  f: Field,
  fieldname: string,
  filters: any,
  doc: any,
  oldDoc: any
) {
  if (!filters) {
    f.link_filters = oldDoc.find((f) => f.fieldname === fieldname).link_filters;
    return;
  }
  f.link_filters = JSON.stringify([[f.options, "name", "in", filters]]);

  // reset dependent field
  doc[fieldname] = "";
}

//

/* export function parseField2(field,doc) {
  field['display_via_depends_on'] = evaluateDependsOnValue(field?.depends_on, doc);
  field['required'] = field.required ||
    (field.mandatory_depends_on &&
      evaluateDependsOnValue(field.mandatory_depends_on, doc));
  field['filters'] = field.link_filters ? setupFieldFilters2(field,doc) : [];
  field['filter_based_on'] = [];
  setupFieldFilters(field);
} */

export function parseField(field, doc) {

  
  let result = {
    ...field,
    display_via_depends_on: computed(()=> evaluateDependsOnValue(field.depends_on, doc)),
    required: field.required,
    required_via_depends_on: computed(()=> {
      return field.mandatory_depends_on && evaluateDependsOnValue(field.mandatory_depends_on, doc)
    }),
    filters: field.link_filters ? setupFieldFilters2(field,doc) : [],
    filter_based_on: [],
  };
  result['validationMessage'] = computed(()=> validateField(result,doc[field.fieldname]));
  setupFieldFilters(result);
  let r = reactive(result);
  return r;
}

function setupFieldFilters2(field,doc) {
 
  let filters = JSON.parse(field.link_filters);
  let result = [];
  filters.forEach(f=> {
    result.push({
      doctype: f[0],
      field: f[1],
      operator: f[2],
      expression: f[3],
      based_on: getFilterBasedOn(f[3]),
      value: null,
      function: computed(()=> evaluateFilter3(f[2],f[3], doc))
    })
  });
  
  return result;

}

function getFilterBasedOn(expression) {
  const regex = /doc\.([^\s]*)(?=\s|$)/g;
  let matches = [...expression.matchAll(regex)];
  return matches.map(match => match[1]);
}

function setupFieldFilters(field) {

  if (!field.filters)
    return;

  let evals = field.filters.map((filter) => {
    return filter.expression;
  }).join(" ");
  // regex to match doc.fieldname in link_filters
  // e.g. doc.fieldname, doc.fieldname1, doc.fieldname2
  // This regex will match doc.fieldname followed by a space or end of string
  const regex = /doc\.([^\s]*)(?=\s|$)/g;
  let matches = [...evals.matchAll(regex)];
  field.filter_based_on.push(...matches.map(match => match[1]));
}

function evaluateFilter3(operator,exp,doc) {
  if (!operator || !exp) return '';

  if (operator == "is")
    return exp;

  let out = null;
  if (exp.substr(0, 5) == "eval:") {
    try {
      out = _eval(exp.substr(5), { doc });
    } catch (e) {
    }
  } else {
    let value = doc[exp];
    if (Array.isArray(value)) {
      out = !!value.length;
    } else {
      out = !!value;
    }
  }
  return out;
}

/* function evaluateFilter2(filter,doc) {

  let expression = filter[3];
  if (expression.substr(0, 5) == "eval:") {
    try {
      filter[4] = _evalFilter(expression.substr(5), { doc });
    } catch (e) {
      console.log("Error evaluating the following expression:");
      console.error(expression);
    }
  } else if (expression.substr(0, 4) == "doc.") {
    filter[4] = doc[expression.substr(4)];
  }

} */

export function evaluateFilter(field, doc) {
  field.filters.forEach(filter => {
    let expression = filter.expression;
    if (expression.substr(0,5) == "eval:") {
      try {
        filter.value = _evalFilter(expression.substr(5), { doc });
      } catch (e) {
        console.log("Error evaluating the following expression:");
        console.error(expression);
      }
    } else if (expression.substr(0,4) == "doc.") {
      filter.value = doc[expression.substr(4)]; 
    }


  });
  
/*   if (!expression) return '';
  let out = null;
  if (expression.substr(0, 5) == "eval:") {
    try {
      out = _evalFilter(expression.substr(5), { doc });
    } catch (e) {
      out = true;
    }
  } else if (expression.substr(0, 4) == "doc.") {
    out = doc[expression.substr(4)];
  } else {
    let value = doc[expression];
    if (Array.isArray(value)) {
      out = !!value.length;
    } else {
      out = !!value;
    }
  }
  return out; */
}

function _evalFilter(code, context = {}) {
  let variable_names = Object.keys(context);
  let variables = Object.values(context);
  code = `return ${code};`;
  try {
    let expression_function = new Function(...variable_names, code);
    let result= expression_function(...variables);
    return result;
  } catch (error) {
    console.log("Error evaluating the following expression:");
    console.error(code);
    throw error;
  }
}

function evaluateDependsOnValue(expression, doc) {


  if (!expression) return true;
  let out = true;
  if (expression.substr(0, 5) == "eval:") {
    try {
      return _eval(expression.substr(5), { doc });
    } catch (e) {
      out = true;
    }
  } else if (expression.substr(0, 4) == "doc.") {
    out = doc[expression.substr(4)];
  } else {
    let value = doc[expression];
    if (Array.isArray(value)) {
      out = !!value.length;
    } else {
      out = !!value;
    }
  }
  return out;
}

function _eval(code, context = {}) {
  let variable_names = Object.keys(context);
  let variables = Object.values(context);
  code = `let out = ${code}; return out`;
  try {
    
    let expression_function = new Function(...variable_names, code);
    return expression_function(...variables);
  } catch (error) {
    console.log("Error evaluating the following expression:");
    console.error(code);
    throw error;
  }
}

export function validateField(field : Field, value: any) {

  if ((field.required == 1 || field.required_via_depends_on.value == true) && isEmptyString(value)) {
    return 'This field is required';
  }

  switch (field.fieldtype) {
    case "Phone":
      if (value && !/^\+966-5[0-9]{8}$/.test(value)) {
        return 'Invalid phone number format';
      }
      break;
      case "Email":
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invlaid email address';
      }
      break;
  }

  return '';

}
