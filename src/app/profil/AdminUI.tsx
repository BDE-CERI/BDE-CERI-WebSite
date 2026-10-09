"use client";

import { cloneElement, isValidElement, createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type ActionResult = { error?: string; success?: boolean };
export type AdminMessages = {
  save: string; saving: string; saved: string; failed: string; cancel: string; search: string;
  delete: string; deleting: string; unsaved_title: string; unsaved_description: string;
  discard: string; keep_editing: string; unsaved_notice: string;
};

const defaults: AdminMessages = {
  save: "Enregistrer", saving: "Enregistrement…", saved: "Modifications enregistrées.",
  failed: "La modification n’a pas pu être enregistrée. Réessayez.", cancel: "Annuler", search: "Rechercher",
  delete: "Supprimer", deleting: "Suppression…", unsaved_title: "Des modifications ne sont pas enregistrées",
  unsaved_description: "Vous avez une saisie en cours. La quitter supprimera les changements qui n’ont pas encore été enregistrés.",
  discard: "Quitter sans enregistrer", keep_editing: "Continuer à modifier", unsaved_notice: "Modifications non enregistrées",
};

const WorkspaceContext = createContext<{ messages: AdminMessages; markDirty: (id: string, dirty: boolean) => void; requestDiscard: (proceed: () => void) => void; dirtyCount: number }>({
  messages: defaults,
  markDirty: () => {},
  requestDiscard: (proceed: () => void) => proceed(),
  dirtyCount: 0,
});

export const useAdminWorkspace = () => useContext(WorkspaceContext);
export const inputClass = "w-full min-w-0 rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-tertiary focus:ring-2 focus:ring-tertiary/15 disabled:cursor-not-allowed disabled:opacity-60";

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, pending = false, destructive = false, error, onConfirm, onCancel }: {
  open: boolean; title: string; description: string; confirmLabel: string; cancelLabel: string;
  pending?: boolean; destructive?: boolean; error?: string | null; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-outline-variant/30 bg-surface-container-low p-0 text-on-surface shadow-2xl backdrop:bg-black/65">
      <div className="p-6 sm:p-8">
        <span aria-hidden="true" className={"material-symbols-outlined mb-4 text-3xl " + (destructive ? "text-error" : "text-tertiary")}>{destructive ? "delete_forever" : "edit_note"}</span>
        <h2 id={titleId} className="font-headline text-xl font-bold">{title}</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-on-surface-variant">{description}</p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-error/25 bg-error/10 p-3 text-sm text-error">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" autoFocus disabled={pending} onClick={onCancel} className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{cancelLabel}</button>
          <button type="button" disabled={pending} onClick={onConfirm} className={"rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 " + (destructive ? "bg-error text-on-error" : "bg-tertiary text-on-tertiary")}>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}

export function AdminWorkspaceProvider({ children, messages = defaults }: { children: ReactNode; messages?: AdminMessages }) {
  const router = useRouter();
  const dirtyForms = useRef(new Set<string>());
  const nextAction = useRef<(() => void) | null>(null);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const markDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyForms.current.add(id); else dirtyForms.current.delete(id);
    setDirtyCount(dirtyForms.current.size);
  }, []);
  const requestDiscard = useCallback((proceed: () => void) => {
    if (!dirtyForms.current.size) { proceed(); return; }
    nextAction.current = proceed;
    setConfirmOpen(true);
  }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyForms.current.size) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onLink = (event: MouseEvent) => {
      if (!dirtyForms.current.size || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (!["http:", "https:"].includes(target.protocol)) return;
      if (target.origin === current.origin && target.pathname === current.pathname && target.search === current.search) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      requestDiscard(() => {
        if (target.origin === current.origin) router.push(target.pathname + target.search + target.hash);
        else window.location.assign(target.href);
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onLink, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", onLink, true); };
  }, [requestDiscard, router]);
  const context = useMemo(() => ({ messages, markDirty, requestDiscard, dirtyCount }), [messages, markDirty, requestDiscard, dirtyCount]);
  return (
    <WorkspaceContext.Provider value={context}>
      {children}
      <ConfirmDialog open={confirmOpen} title={messages.unsaved_title} description={messages.unsaved_description}
        confirmLabel={messages.discard} cancelLabel={messages.keep_editing}
        onCancel={() => { nextAction.current = null; setConfirmOpen(false); }}
        onConfirm={() => {
          const proceed = nextAction.current;
          nextAction.current = null; setConfirmOpen(false); proceed?.();
        }} />
    </WorkspaceContext.Provider>
  );
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  const id = useId();
  const hintId = id + "-hint";
  const labelId = id + "-label";
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(children) &&
    typeof children.type === "string" && ["input", "textarea", "select"].includes(children.type) ? children : null;
  const controlId = control ? control.props.id || id : undefined;
  const content = control ? cloneElement(control, {
    id: controlId,
    "aria-describedby": [control.props["aria-describedby"], hint ? hintId : undefined].filter(Boolean).join(" ") || undefined,
  }) : children;
  const text = <>{label}{required && <span aria-hidden="true" className="ml-1 text-tertiary">*</span>}</>;
  return (
    <div className="min-w-0 space-y-2" role={control ? undefined : "group"} aria-labelledby={control ? undefined : labelId}>
      {control ? <label htmlFor={controlId} className="block text-xs font-semibold text-on-surface">{text}</label> : <span id={labelId} className="block text-xs font-semibold text-on-surface">{text}</span>}
      {content}
      {hint && <p id={hintId} className="text-xs leading-5 text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export function AdminForm({ action, children, submitLabel, successMessage, onSuccess, onCancel, resetOnSuccess = false, className = "" }: {
  action: (data: FormData) => Promise<ActionResult>;
  children: ReactNode; submitLabel?: string; successMessage?: string;
  onSuccess?: () => void; onCancel?: () => void; resetOnSuccess?: boolean; className?: string;
}) {
  const { messages, markDirty, requestDiscard } = useAdminWorkspace();
  const router = useRouter();
  const formId = useId();
  const ref = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  useEffect(() => { markDirty(formId, dirty); return () => markDirty(formId, false); }, [dirty, formId, markDirty]);
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);
    busy.current = true; setPending(true); setFeedback(null);
    try {
      const result = await action(data);
      if (result?.error || !result?.success) {
        setFeedback({ kind: "error", text: result?.error || messages.failed });
        return;
      }
      setDirty(false); markDirty(formId, false);
      ref.current?.dispatchEvent(new Event("admin:saved"));
      if (resetOnSuccess) ref.current?.reset();
      setFeedback({ kind: "success", text: successMessage || messages.saved });
      onSuccess?.();
      router.refresh();
    } catch {
      setFeedback({ kind: "error", text: messages.failed });
    } finally {
      busy.current = false; setPending(false);
    }
  };
  return (
    <form ref={ref} onSubmit={onSubmit} onChangeCapture={() => { setDirty(true); setFeedback(null); }}
      onInputCapture={() => { setDirty(true); setFeedback(null); }}
      aria-busy={pending} className={"space-y-6 " + className}>
      <fieldset disabled={pending} className="min-w-0 space-y-6 disabled:opacity-75">{children}</fieldset>
      {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={"rounded-xl border p-3 text-sm leading-6 " + (feedback.kind === "error" ? "border-error/25 bg-error/10 text-error" : "border-tertiary/25 bg-tertiary/10 text-on-surface")}>{feedback.text}</p>}
      <div className="flex flex-col gap-3 border-t border-outline-variant/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-xs text-on-surface-variant" aria-live="polite">{dirty && !pending ? messages.unsaved_notice : ""}</p>
        <div className="flex flex-wrap gap-2">
          {onCancel && <button type="button" disabled={pending} onClick={() => requestDiscard(() => { setDirty(false); markDirty(formId, false); onCancel(); })}
            className="flex-1 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 sm:flex-none">{messages.cancel}</button>}
          <button type="submit" disabled={pending} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-tertiary px-5 py-2.5 text-sm font-bold text-on-tertiary transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 sm:flex-none">
            <span aria-hidden="true" className={"material-symbols-outlined text-lg " + (pending ? "animate-spin" : "")}>{pending ? "progress_activity" : "check"}</span>
            {pending ? messages.saving : submitLabel || messages.save}
          </button>
        </div>
      </div>
    </form>
  );
}

export function ConfirmDeleteButton({ action, title, description, onSuccess, label }: {
  action: () => Promise<ActionResult>; title: string; description: string; onSuccess?: () => void; label?: string;
}) {
  const { messages } = useAdminWorkspace();
  const router = useRouter();
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try {
      const result = await action();
      if (result?.error || !result?.success) { setError(result?.error || messages.failed); return; }
      setOpen(false); onSuccess?.(); router.refresh();
    } catch { setError(messages.failed); } finally { busy.current = false; setPending(false); }
  };
  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-error/20 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/10">
        <span aria-hidden="true" className="material-symbols-outlined text-base">delete</span>{label || messages.delete}
      </button>
      <ConfirmDialog open={open} title={title} description={description} confirmLabel={pending ? messages.deleting : label || messages.delete}
        cancelLabel={messages.cancel} destructive pending={pending} error={error} onConfirm={() => void remove()} onCancel={() => setOpen(false)} />
    </>
  );
}

export function ManagerToolbar({ search, onSearch, placeholder, children }: {
  search: string; onSearch: (value: string) => void; placeholder?: string; children?: ReactNode;
}) {
  const { messages } = useAdminWorkspace();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full min-w-0 sm:max-w-sm">
        <span className="sr-only">{placeholder || messages.search}</span>
        <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
        <input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder || messages.search} className={inputClass + " pl-10"} />
      </label>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon = "search_off", title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/30 px-6 py-12 text-center">
      <span aria-hidden="true" className="material-symbols-outlined mb-3 text-3xl text-tertiary">{icon}</span>
      <p className="font-semibold text-on-surface">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>}
    </div>
  );
}
