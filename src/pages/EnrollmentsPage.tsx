import React, { useState } from 'react';
import { ArrowLeft, GraduationCap, ExternalLink, Check, FileCheck, Shield, Home, UserCheck, AlertCircle } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface EnrollmentsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
}

interface UniversityItem {
  name: string;
  shortName: string;
  city: string;
  url: string;
  description: string;
  internationalPortalUrl: string;
}

export const EnrollmentsPage: React.FC<EnrollmentsPageProps> = ({ onBack, locale = 'en' }) => {
  // 6-step arrival checklist from Section 10
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    admission: true,
    visa: false,
    insurance: false,
    accommodation: true,
    meldunek: false,
    pesel: false,
  });

  const universities: UniversityItem[] = [
    {
      name: 'Maria Curie-Skłodowska University (UMCS)',
      shortName: 'UMCS',
      city: 'Lublin',
      url: 'https://www.umcs.pl',
      internationalPortalUrl: 'https://www.umcs.pl/en/applicant.htm',
      description: 'Largest public university in eastern Poland. Renowned faculties in biology, humanities, and international relations.',
    },
    {
      name: 'John Paul II Catholic University of Lublin (KUL)',
      shortName: 'KUL',
      city: 'Lublin',
      url: 'https://www.kul.pl',
      internationalPortalUrl: 'https://www.kul.pl/admissions,16165.html',
      description: 'One of the oldest universities in Poland, offering accredited degrees in English across law, philosophy, and management.',
    },
    {
      name: 'Lublin University of Technology (Politechnika Lubelska)',
      shortName: 'Politechnika',
      city: 'Lublin',
      url: 'https://pollub.pl',
      internationalPortalUrl: 'https://bwm.pollub.pl/en/',
      description: 'Leading engineering and computer science university with campus located directly on ul. Nadbystrzycka.',
    },
    {
      name: 'Lublin University of Economics and Innovation (WSEI)',
      shortName: 'WSEI',
      city: 'Lublin',
      url: 'https://wsei.lublin.pl',
      internationalPortalUrl: 'https://en.wsei.lublin.pl/',
      description: 'Modern university with specialized English programs in transport, nursing, and computer science.',
    },
    {
      name: 'Vincent Pol University in Lublin (VPU)',
      shortName: 'VPU',
      city: 'Lublin',
      url: 'https://vpu.edu.pl',
      internationalPortalUrl: 'https://vpu.edu.pl/admissions/',
      description: 'Private higher education institution welcoming international students in physiotherapy, tourism, and nursing.',
    },
  ];

  const checklistItems = [
    {
      id: 'admission',
      title: '1. University Admission Letter',
      desc: 'Official acceptance document issued by your university admissions office.',
    },
    {
      id: 'visa',
      title: '2. Visa / Temporary Residence Permit (Karta Pobytu)',
      desc: 'National D-type student visa or application for a residence permit (karta pobytu) at Urząd Wojewódzki.',
    },
    {
      id: 'insurance',
      title: '3. Health Insurance Coverage',
      desc: 'NFZ voluntary student insurance or private policy covering medical costs in Poland.',
    },
    {
      id: 'accommodation',
      title: '4. Proof of Accommodation (Potwierdzenie Zamieszkania)',
      desc: 'Signed Relok8 lease assignment protocol or rental agreement required for visa and registration.',
    },
    {
      id: 'meldunek',
      title: '5. Address Registration (Meldunek)',
      desc: 'Mandatory city registration completed at the local City Office (Urząd Miasta) with your signed lease.',
    },
    {
      id: 'pesel',
      title: '6. National Identification Number (PESEL)',
      desc: 'Automatically assigned upon completing address registration (meldunek) or applied for with passport.',
    },
  ];

  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-36 sm:pb-24 font-sans">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 leading-tight truncate">
              <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>{locale === 'pl' ? 'Uczelnie i Przyjazd do Polski' : 'Study & Arrival in Poland'}</span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">
              Official university portals in Lublin and the 6 essential arrival steps for students and expats.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* 6-STEP ARRIVAL CHECKLIST (§10) */}
        <section aria-labelledby="arrival-checklist" className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 id="arrival-checklist" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <span>Essential Arrival Checklist ({completedCount}/6 completed)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep track of your mandatory legal and academic onboarding steps in Poland.
              </p>
            </div>

            <div className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${(completedCount / 6) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {checklistItems.map(item => {
              const isDone = checklist[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isDone ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                  }`}>
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* UNIVERSITIES DIRECTORY (§10) */}
        <section aria-labelledby="univ-directory" className="space-y-4">
          <div className="space-y-1">
            <h2 id="univ-directory" className="text-base font-bold text-slate-900">
              Higher Education Institutions in Lublin
            </h2>
            <p className="text-xs text-slate-500">
              Links direct exclusively to verified official university portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universities.map((u) => (
              <div
                key={u.shortName}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {u.city}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{u.shortName}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{u.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={u.internationalPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Apply / Enroll</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Official site
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
