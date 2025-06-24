import { ref, computed } from 'vue'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useStorage } from '@vueuse/core'

const cookies = useCookies();
const lang = useStorage('user_lang', localStorage.getItem('user_lang') || cookies.get('user_lang') || 'en');

document.documentElement.setAttribute('lang', lang.value);
if (lang.value == 'ar') { 
  document.documentElement.setAttribute('dir', 'rtl');
  injectRtlCSS();
}

function injectRtlCSS() {
  import ('./assets/css/style.rtl.css');
/*   const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = './css/style.rtl.css';
  document.head.appendChild(link); */
}

export function getCurrentLanguage() {
  return lang.value;
}

export function changeLanguage(_lang) {
  lang.value = _lang;
  window.location.reload();
}


