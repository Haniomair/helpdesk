import { ref, computed } from 'vue'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useStorage } from '@vueuse/core'

const cookies = useCookies();
const lang = useStorage('user_lang', localStorage.getItem('user_lang') || cookies.get('user_lang') || 'en');

document.documentElement.setAttribute('lang', lang.value);
if (lang.value == 'ar') document.documentElement.setAttribute('dir', 'rtl');



export function getCurrentLanguage() {
  return lang.value;
}

export function changeLanguage(_lang) {
  lang.value = _lang;
  window.location.reload();
}


