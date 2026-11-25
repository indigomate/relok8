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
  return <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-24">
    <button type="button" onClick={onBack} className="flex items-center gap-2 min-h-11 text-sm text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-600"><ArrowLeft size={18}/>{pl?'Wróć':'Back'}</button>
    <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-indigo-600">Relok8</p>
    <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">{pl?'Usługi':'Services'}</h1>
    <p className="mt-3 text-slate-600">{pl?'Narzędzia i wsparcie na każdym etapie najmu.':'Useful tools and support throughout your rental journey.'}</p>
    <div className="mt-8 grid sm:grid-cols-2 gap-4">{items.map(({icon:Icon,title,description,path})=><button key={path} type="button" onClick={()=>onNavigate(path)} className="flex items-center gap-4 text-left p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors"><span className="flex shrink-0 w-12 h-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={22}/></span><span className="flex-1"><span className="block font-semibold text-slate-900">{title}</span><span className="block text-sm mt-1 text-slate-600">{description}</span></span><ArrowRight size={17} className="shrink-0 text-slate-400"/></button>)}</div>
  </main>;
}
