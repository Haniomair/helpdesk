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
}

export function getCurrentLanguage() {
  return lang.value;
}

export function getDirection() {
  return lang.value === 'ar' ? 'rtl' : 'ltr';
}

export function changeLanguage(_lang) {
  lang.value = _lang;
  window.location.reload();
}


