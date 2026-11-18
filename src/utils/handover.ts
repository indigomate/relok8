const HANDOVER_STEPS = ['documents', 'deposit', 'keys'] as const;
export const HANDOVER_ROLES = ['tenant', 'landlord', 'applicant'] as const;
export type HandoverStep = typeof HANDOVER_STEPS[number];
export type HandoverRole = typeof HANDOVER_ROLES[number];
type Confirmations = Partial<Record<HandoverStep, Partial<Record<HandoverRole, { confirmed?: boolean }>>>>;

// Mirror the backend's ordering for guidance only; authorization stays on the server.
export function handoverProgress(confirmations: Confirmations = {}, role: HandoverRole) {
  const complete = (step: HandoverStep) => HANDOVER_ROLES.every(r => confirmations[step]?.[r]?.confirmed);
  const currentStep = HANDOVER_STEPS.find(step => !complete(step));
  return {
    currentStep,
    waitingForOthers: !!currentStep && !!confirmations[currentStep]?.[role]?.confirmed,
    steps: HANDOVER_STEPS.map((step, index) => {
      const checked = !!confirmations[step]?.[role]?.confirmed;
      const previousIncomplete = HANDOVER_STEPS.slice(0, index).some(s => !complete(s));
      const laterConfirmed = HANDOVER_STEPS.slice(index + 1).some(s =>
        HANDOVER_ROLES.some(r => confirmations[s]?.[r]?.confirmed));
      return { step, checked, complete: complete(step), locked: checked ? laterConfirmed : previousIncomplete };
    }),
  };
}
