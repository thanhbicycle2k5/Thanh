import * as React from 'react';
import { addWeeks, startOfWeek, subWeeks } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, KeyRound, LockKeyhole } from 'lucide-react';
import { User } from 'firebase/auth';
import { Plan, Language, Theme } from '../types';
import { TranslationKey, translations } from '../lib/i18n';
import {
  createSecretCalendarVault,
  decryptSecretCalendarPlans,
  encryptSecretCalendarPlans,
  loadSecretCalendarVault,
  rewrapSecretCalendarKey,
  saveSecretCalendarVault,
  SecretCalendarVault,
  storeSecretCalendarRecoveryKey,
  unlockSecretCalendarVault,
  requestSecretCalendarRecoveryCode,
  verifySecretCalendarRecoveryCode,
} from '../lib/secretCalendar';
import { ScheduleGrid } from './ScheduleGrid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SecretCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  language: Language;
  theme: Theme;
  startHour: number;
  endHour: number;
}

const getFirebaseErrorCode = (error: unknown): string => (
  typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
);

export function SecretCalendarDialog({
  open,
  onOpenChange,
  user,
  language,
  theme,
  startHour,
  endHour,
}: SecretCalendarDialogProps) {
  const [vault, setVault] = React.useState<SecretCalendarVault | null>(null);
  const [vaultKey, setVaultKey] = React.useState<Uint8Array | null>(null);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const vaultRef = React.useRef<SecretCalendarVault | null>(null);
  const vaultKeyRef = React.useRef<Uint8Array | null>(null);
  const plansRef = React.useRef<Plan[]>([]);
  const saveQueueRef = React.useRef<Promise<void>>(Promise.resolve());
  const [loaded, setLoaded] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const [recovering, setRecovering] = React.useState(false);
  const [codeSent, setCodeSent] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [recoveryCode, setRecoveryCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [selectedWeekStart, setSelectedWeekStart] = React.useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const t = React.useCallback((key: TranslationKey, params: Record<string, string> = {}) => {
    let text = translations[language][key] ?? translations.en[key];
    Object.entries(params).forEach(([name, value]) => {
      text = text.replace(`{${name}}`, value);
    });
    return text;
  }, [language]);

  React.useEffect(() => {
    let active = true;
    setVault(null);
    setVaultKey(null);
    setPlans([]);
    vaultRef.current = null;
    vaultKeyRef.current = null;
    plansRef.current = [];
    setLoaded(false);
    setLoadFailed(false);
    setUnlocked(false);
    setRecovering(false);
    setCodeSent(false);
    setError('');

    if (!open) return () => { active = false; };
    if (!user) {
      setLoaded(true);
      return () => { active = false; };
    }

    void loadSecretCalendarVault(user.uid)
      .then((loadedVault) => {
        if (active) {
          setVault(loadedVault);
          vaultRef.current = loadedVault;
          setLoaded(true);
        }
      })
      .catch((loadError: unknown) => {
        const code = getFirebaseErrorCode(loadError);
        console.error('Unable to load secret calendar:', { code, error: loadError });
        if (active) {
          setError(
            code === 'permission-denied'
              ? t(user.emailVerified ? 'secretCalendarPermissionError' : 'secretCalendarVerifyEmailError')
              : t('secretCalendarLoadError')
          );
          setLoadFailed(true);
          setLoaded(true);
        }
      });

    return () => { active = false; };
  }, [open, user, t, loadAttempt]);

  const lockAndClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUnlocked(false);
      setVaultKey(null);
      setPlans([]);
      vaultKeyRef.current = null;
      plansRef.current = [];
      setPassword('');
      setConfirmPassword('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    onOpenChange(nextOpen);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('secretCalendarPasswordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('secretCalendarPasswordMismatch'));
      return;
    }
    if (!user?.email || !user.emailVerified) {
      setError(t('secretCalendarVerifiedEmailRequired'));
      return;
    }

    setBusy(true);
    try {
      const created = await createSecretCalendarVault(password);
      await storeSecretCalendarRecoveryKey(created.vaultKey);
      await saveSecretCalendarVault(user.uid, created.vault);
      setVault(created.vault);
      setVaultKey(created.vaultKey);
      setPlans([]);
      vaultRef.current = created.vault;
      vaultKeyRef.current = created.vaultKey;
      plansRef.current = [];
      setUnlocked(true);
      setPassword('');
      setConfirmPassword('');
    } catch (createError) {
      console.error('Unable to create secret calendar:', createError);
      setError(t('secretCalendarSetupError'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vault) return;
    setBusy(true);
    setError('');
    try {
      const result = await unlockSecretCalendarVault(vault, password);
      setVaultKey(result.vaultKey);
      setPlans(result.plans);
      vaultKeyRef.current = result.vaultKey;
      plansRef.current = result.plans;
      setUnlocked(true);
      setPassword('');
    } catch (unlockError) {
      console.error('Unable to unlock secret calendar:', unlockError);
      setError(t('secretCalendarIncorrectPassword'));
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    setBusy(true);
    setError('');
    try {
      await requestSecretCalendarRecoveryCode();
      setCodeSent(true);
    } catch (requestError) {
      console.error('Unable to send secret calendar recovery code:', requestError);
      setError(t('secretCalendarCodeSendError'));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vault || !user) return;
    if (newPassword.length < 8) {
      setError(t('secretCalendarPasswordTooShort'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('secretCalendarPasswordMismatch'));
      return;
    }

    setBusy(true);
    setError('');
    try {
      const recoveredKey = await verifySecretCalendarRecoveryCode(recoveryCode.trim());
      const updatedVault = await rewrapSecretCalendarKey(vault, recoveredKey, newPassword);
      const recoveredPlans = await decryptSecretCalendarPlans(vault, recoveredKey);
      await saveSecretCalendarVault(user.uid, updatedVault);
      setVault(updatedVault);
      setVaultKey(recoveredKey);
      setPlans(recoveredPlans);
      vaultRef.current = updatedVault;
      vaultKeyRef.current = recoveredKey;
      plansRef.current = recoveredPlans;
      setUnlocked(true);
      setRecovering(false);
      setCodeSent(false);
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (resetError) {
      console.error('Unable to reset secret calendar password:', resetError);
      const code = typeof resetError === 'object' && resetError !== null && 'code' in resetError
        ? String(resetError.code)
        : '';
      setError(
        ['functions/permission-denied', 'functions/deadline-exceeded', 'functions/resource-exhausted'].includes(code)
          ? t('secretCalendarCodeInvalid')
          : t('secretCalendarResetError')
      );
    } finally {
      setBusy(false);
    }
  };

  const savePlans = async (nextPlans: Plan[]) => {
    const currentVault = vaultRef.current ?? vault;
    const currentVaultKey = vaultKeyRef.current ?? vaultKey;
    if (!currentVault || !currentVaultKey || !user) return;
    plansRef.current = nextPlans;
    setPlans(nextPlans);
    const userId = user.uid;
    const save = saveQueueRef.current.catch(() => undefined).then(async () => {
      const updatedVault = await encryptSecretCalendarPlans(currentVault, currentVaultKey, nextPlans);
      if (vaultKeyRef.current === currentVaultKey) {
        setVault(updatedVault);
        vaultRef.current = updatedVault;
      }
      await saveSecretCalendarVault(userId, updatedVault);
      setError('');
    });
    saveQueueRef.current = save;
    try {
      await save;
    } catch (saveError) {
      console.error('Unable to save secret calendar:', saveError);
      setError(t('secretCalendarSaveError'));
      throw saveError;
    }
  };

  const handleAddPlan = (plan: Plan) => {
    void savePlans([...plansRef.current, plan]).catch((saveError: unknown) => {
      console.error('Unable to add secret calendar plan:', saveError);
      setError(t('secretCalendarSaveError'));
    });
  };
  const handleUpdatePlan = (plan: Plan) => {
    void savePlans(plansRef.current.map((current) => current.id === plan.id ? plan : current)).catch((saveError: unknown) => {
      console.error('Unable to update secret calendar plan:', saveError);
      setError(t('secretCalendarSaveError'));
    });
  };
  const handleDeletePlan = async (id: string) => {
    await savePlans(plansRef.current.filter((plan) => plan.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={lockAndClose}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t('secretCalendar')}
          </DialogTitle>
          <DialogDescription>{t('secretCalendarDescription')}</DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            {t('secretCalendarSignIn')}
          </div>
        ) : !loaded ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('secretCalendarLoading')}</p>
        ) : loadFailed ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" className="w-full" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              {t('secretCalendarRetry')}
            </Button>
          </div>
        ) : unlocked ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <LockKeyhole className="h-4 w-4 text-emerald-600" />
                {t('secretCalendarUnlocked')}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label={t('previousWeek')} onClick={() => setSelectedWeekStart((week) => subWeeks(week, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={t('nextWeek')} onClick={() => setSelectedWeekStart((week) => addWeeks(week, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" onClick={() => lockAndClose(false)}>
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  {t('secretCalendarLock')}
                </Button>
              </div>
            </div>
            <ScheduleGrid
              currentWeekStart={selectedWeekStart}
              plans={plans}
              allPlans={plans}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              language={language}
              theme={theme}
              startHour={startHour}
              endHour={endHour}
              showLunarCalendar={false}
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        ) : !vault ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('secretCalendarEmptyNotice')}</p>
            <div className="space-y-2">
              <Label htmlFor="secret-calendar-password">{t('secretCalendarPassword')}</Label>
              <Input id="secret-calendar-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-calendar-confirm-password">{t('secretCalendarConfirmPassword')}</Label>
              <Input id="secret-calendar-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
            </div>
            <p className="text-xs text-muted-foreground">{t('secretCalendarRecoveryNotice')}</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} type="submit">
              <KeyRound className="mr-2 h-4 w-4" />
              {busy ? t('secretCalendarLoading') : t('secretCalendarCreate')}
            </Button>
          </form>
        ) : recovering ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {!codeSent ? (
              <>
                <p className="text-sm text-muted-foreground">{t('secretCalendarRecoveryNotice')}</p>
                <Button className="w-full" disabled={busy || !user.email} type="button" onClick={() => void handleSendCode()}>
                  {busy ? t('secretCalendarLoading') : t('secretCalendarSendCode')}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('secretCalendarCodeSent', { email: user?.email ?? '' })}</p>
                <div className="space-y-2">
                  <Label htmlFor="secret-calendar-code">{t('secretCalendarEmailCode')}</Label>
                  <Input id="secret-calendar-code" inputMode="numeric" autoComplete="one-time-code" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-calendar-new-password">{t('secretCalendarNewPassword')}</Label>
                  <Input id="secret-calendar-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-calendar-confirm-new-password">{t('secretCalendarConfirmPassword')}</Label>
                  <Input id="secret-calendar-confirm-new-password" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required minLength={8} />
                </div>
                <Button className="w-full" disabled={busy} type="submit">
                  {busy ? t('secretCalendarLoading') : t('secretCalendarResetPassword')}
                </Button>
              </>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button variant="ghost" className="w-full" type="button" onClick={() => { setRecovering(false); setCodeSent(false); setError(''); }}>
              {t('cancel')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-calendar-unlock-password">{t('secretCalendarPassword')}</Label>
              <Input id="secret-calendar-unlock-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} type="submit">
              <LockKeyhole className="mr-2 h-4 w-4" />
              {busy ? t('secretCalendarLoading') : t('secretCalendarUnlock')}
            </Button>
            <Button className="w-full" variant="ghost" type="button" onClick={() => { setRecovering(true); setError(''); }}>
              {t('secretCalendarForgotPassword')}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
