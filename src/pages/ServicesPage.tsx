import React from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, ShieldCheck, Calculator, Award, FileText, Home } from 'lucide-react';
import type { SupportedLocale } from '../utils/formatters';

export function ServicesPage({locale,onBack,onNavigate}:{locale:SupportedLocale;onBack:()=>void;onNavigate:(path:string)=>void}) {
  const pl=locale==='pl';
  const items=[
    {icon:Home,title:pl?'Jak to działa':'How it works',description:pl?'Poznaj proces przejęcia najmu.':'Learn how rental transfers work.',path:'/how-it-works'},
    {icon:Calculator,title:pl?'Kalkulator oszczędności':'Savings calculator',description:pl?'Porównaj koszty przeprowadzki.':'Compare relocation costs.',path:'/savings-calculator'},
    {icon:FileText,title:pl?'Dokumenty i poradniki':'Documents and guides',description:pl?'Wzór uzgodnienia przejęcia najmu.':'Explore the takeover agreement template.',path:'/cesja-template'},
    {icon:ShieldCheck,title:pl?'Bezpieczny najem':'Rental safety',description:pl?'Sprawdź wskazówki dotyczące bezpieczeństwa.':'Read practical rental safety guidance.',path:'/safety-guide'},
    {icon:Award,title:pl?'Program nagród':'Tenant rewards',description:pl?'Sprawdź program Relok8.':'Discover the Relok8 rewards programme.',path:'/rewards'},
    {icon:CircleHelp,title:pl?'Pomoc i wsparcie':'Help and support',description:pl?'Znajdź odpowiedzi na pytania.':'Find answers and get assistance.',path:'/help'},
  ];
  return (
    <main className="r8-motion-page w-full min-w-0 max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-slate-600 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-600">
        <ArrowLeft size={16}/>{pl?'Wróć':'Back'}
      </button>
      <header className="mt-1 mb-4 sm:mb-6">
        <h1 className="!text-2xl sm:!text-3xl !leading-tight font-bold tracking-tight text-slate-900">{pl?'Usługi':'Services'}</h1>
        <p className="mt-1 !text-sm !leading-snug text-slate-600">{pl?'Narzędzia i wsparcie na każdym etapie najmu.':'Tools and support for your rental journey.'}</p>
      </header>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {items.map(({icon:Icon,title,description,path})=>(
          <button key={path} type="button" onClick={()=>onNavigate(path)} className="relative flex min-w-0 flex-col items-start gap-2 text-left p-3 sm:p-4 md:flex-row md:items-center md:gap-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors">
            <span className="flex shrink-0 w-9 h-9 md:w-12 md:h-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon size={20}/></span>
            <span className="block w-full min-w-0 md:flex-1">
              <span className="block text-sm leading-snug font-semibold text-slate-900 break-words">{title}</span>
              <span className="block text-xs leading-snug mt-1 text-slate-600 break-words">{description}</span>
            </span>
            <ArrowRight size={15} className="absolute right-3 top-4 md:static shrink-0 text-slate-400"/>
          </button>
        ))}
      </div>
    </main>
  );
}
