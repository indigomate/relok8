import { describe, expect, it } from 'vitest';
import { handoverProgress, HANDOVER_ROLES } from '../src/utils/handover';

const everyone = Object.fromEntries(HANDOVER_ROLES.map(role => [role, { confirmed: true }]));

describe('handover guidance', () => {
  it('starts with documents and locks later stages', () => {
    const progress = handoverProgress({}, 'applicant');
    expect(progress.currentStep).toBe('documents');
    expect(progress.steps.map(s => s.locked)).toEqual([false, true, true]);
  });
  it('waits for all participants rather than advancing after one confirmation', () => {
    const progress = handoverProgress({ documents: { applicant: { confirmed: true } } }, 'applicant');
    expect(progress.currentStep).toBe('documents');
    expect(progress.waitingForOthers).toBe(true);
    expect(progress.steps[1].locked).toBe(true);
  });
  it('unlocks deposit only after all three confirm documents', () => {
    const progress = handoverProgress({ documents: everyone }, 'tenant');
    expect(progress.currentStep).toBe('deposit');
    expect(progress.steps.map(s => s.locked)).toEqual([false, false, true]);
  });
  it('requires removing later confirmations before correcting earlier stages', () => {
    const progress = handoverProgress({ documents: everyone, deposit: { landlord: { confirmed: true } } }, 'tenant');
    expect(progress.steps[0].locked).toBe(true);
    expect(progress.steps[1].locked).toBe(false);
  });
  it('permits removing a later confirmation when correcting an inconsistent record', () => {
    const progress = handoverProgress({ deposit: { tenant: { confirmed: true } } }, 'tenant');
    expect(progress.steps[1].checked).toBe(true);
    expect(progress.steps[1].locked).toBe(false);
  });
  it('finishes only when every stage has all three confirmations', () => {
    const progress = handoverProgress({ documents: everyone, deposit: everyone, keys: everyone }, 'landlord');
    expect(progress.currentStep).toBeUndefined();
    expect(progress.waitingForOthers).toBe(false);
    expect(progress.steps.every(s => s.complete)).toBe(true);
  });
});
