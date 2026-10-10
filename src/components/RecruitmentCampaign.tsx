"use client";

import { useState } from "react";

type Props = {
  english?: boolean;
  formUrl: string;
  copy: {
    title: string;
    description: string;
    informationTitle: string;
    information: string;
    consent: string;
    openForm: string;
    formUnavailable: string;
  };
};

export default function RecruitmentCampaign({ english = false, formUrl, copy }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <section id="recrutement" className="scroll-mt-24 rounded-3xl border border-tertiary/20 bg-surface-container-low p-6 shadow-xl sm:p-8">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary">
        <span aria-hidden="true" className="material-symbols-outlined text-2xl">diversity_3</span>
      </div>
      <h2 className="font-headline text-2xl font-bold text-on-surface">{copy.title}</h2>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy.description}</p>

      <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-high/50 p-4">
        <h3 className="text-sm font-bold text-on-surface">{copy.informationTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.information}</p>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm leading-6 text-on-surface">
        <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 size-4 shrink-0 accent-tertiary" />
        <span>{copy.consent}</span>
      </label>

      {accepted && (
        <div className="mt-4" aria-live="polite">
          {formUrl ? (
            <a href={formUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-5 py-3 text-center text-sm font-bold text-on-tertiary transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto">
              {copy.openForm}<span aria-hidden="true" className="material-symbols-outlined text-lg">north_east</span>
            </a>
          ) : (
            <p className="rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-4 text-sm leading-6 text-on-surface-variant">{copy.formUnavailable}</p>
          )}
        </div>
      )}
    </section>
  );
}
