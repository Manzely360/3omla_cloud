import { useI18n } from '../lib/i18n'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded ${lang==='en'?'bg-primary-600 text-white':'bg-gray-700 text-gray-200'}`}
      >{t('lang.english','English')}</button>
      <button
        onClick={() => setLang('ar')}
        className={`px-2 py-1 rounded ${lang==='ar'?'bg-primary-600 text-white':'bg-gray-700 text-gray-200'}`}
      >{t('lang.arabic','Arabic')}</button>
    </div>
  )
}

