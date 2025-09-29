import { useI18n } from '../lib/i18n'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-lg border ${language==='en'?'bg-gradient-to-r from-indigo-500 to-sky-400 text-white border-transparent shadow-md shadow-indigo-200/60':'bg-white/80 text-slate-600 border-indigo-100'}`}
      >English</button>
      <button
        onClick={() => setLanguage('ar')}
        className={`px-2.5 py-1 rounded-lg border ${language==='ar'?'bg-gradient-to-r from-indigo-500 to-sky-400 text-white border-transparent shadow-md shadow-indigo-200/60':'bg-white/80 text-slate-600 border-indigo-100'}`}
      >العربية</button>
    </div>
  )
}
