import {
  Badge,
  Button,
  Dialog,
  ErrorMessage,
  FeatherIcon,
  FormControl,
  frappeRequest,
  FrappeUI,
  Input,
  setConfig,
  TextInput,
  toast,
  Tooltip,
} from "frappe-ui";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { createDialog } from "./components/dialogs";
import "./index.css";
import { router } from "./router";
import { socket } from "./socket";
import { posthogPlugin } from "./telemetry";
import translationPlugin from "./translation";
import { socketio_port } from "../../../../sites/common_site_config.json";
import { clear } from "idb-keyval";

clear(); // Clear the cache on startup

const globalComponents = {
  Badge,
  Button,
  Dialog,
  ErrorMessage,
  FeatherIcon,
  FormControl,
  Input,
  Tooltip,
  TextInput,
};

setConfig("resourceFetcher", frappeRequest);
setConfig("serverMessagesHandler", (msgs) => {
  msgs.forEach((msg) => {
    msg = JSON.parse(msg);
    if (msg && msg.message == "Feedback email has been sent to the customer") {
      toast.success(msg.message);
      return;
    }
    toast.warning(msg.message);
  });
});
setConfig("fallbackErrorHandler", (error) => {
  const msg = error.exc_type
    ? (error.messages || error.message || []).join(", ")
    : error.message;
  toast.error(msg);
});

const pinia = createPinia();
const app = createApp(App);


app.use(FrappeUI,{
  socketio: {
    port: socketio_port, // Use the port from common_site_config.json
  }
});
app.use(pinia);
app.use(router);
app.use(posthogPlugin);
app.use(translationPlugin);

for (const c in globalComponents) {
  app.component(c, globalComponents[c]);
}

app.config.globalProperties.$socket = socket;
app.config.globalProperties.$dialog = createDialog;

if (import.meta.env.DEV) {
  frappeRequest({
    url: "/api/method/helpdesk.www.helpdesk.index.get_context_for_dev",
  }).then((values) => {
    for (let key in values) {
      window[key] = values[key];
    }
    app.mount("#app");
  });
} else {
  app.mount("#app");
}
