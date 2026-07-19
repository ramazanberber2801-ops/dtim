import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, UserCog, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type OrganizationRole = 'owner' | 'admin' | 'staff';

type OrganizationMember = {
  organization_id: string;
  email: string;
  display_name: string | null;
  role: OrganizationRole;
  invitation_status: string | null;
  updated_at: string | null;
};

type Props = {
  organizationId: string;
};

const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Eier',
  admin: 'Administrator',
  staff: 'Ansatt',
};

function statusLabel(status: string | null) {
  if (status === 'accepted' || status === 'active') return 'Aktiv';
  if (status === 'invited') return 'Invitert';
  if (status === 'pending') return 'Venter';
  if (status === 'revoked') return 'Tilbakekalt';
  return status || 'Ukjent';
}

function dateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });
}

export function OrganizationMembersAndRoles({ organizationId }: Props) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | OrganizationRole>('all');

  const load = useCallback(async () => {
    if (!supabase || !organizationId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('organization_admins')
      .select('organization_id,email,display_name,role,invitation_status,updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (queryError) {
      setError(queryError.message || 'Kunne ikke hente organisasjonsmedlemmene.');
      setMembers([]);
    } else {
      setMembers((data || []) as OrganizationMember[]);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('yasaflow-organization-invitation-sent', refresh);
    window.addEventListener('yasaflow-organization-members-changed', refresh);
    return () => {
      window.removeEventListener('yasaflow-organization-invitation-sent', refresh);
      window.removeEventListener('yasaflow-organization-members-changed', refresh);
    };
  }, [load]);

  const counts = useMemo(() => members.reduce<Record<OrganizationRole, number>>((result, member) => {
    result[member.role] = (result[member.role] || 0) + 1;
    return result;
  }, { owner: 0, admin: 0, staff: 0 }), [members]);

  const visible = useMemo(
    () => members.filter((member) => filter === 'all' || member.role === filter),
    [filter, members],
  );

  const changeRole = async (member: OrganizationMember, role: OrganizationRole) => {
    if (!supabase || savingEmail || role === member.role) return;
    setSavingEmail(member.email);
    setError('');
    setMessage('');

    const { error: updateError } = await supabase
      .from('organization_admins')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('email', member.email);

    if (updateError) {
      setError(updateError.message || 'Kunne ikke endre rollen.');
    } else {
      setMembers((current) => current.map((item) => item.email === member.email ? { ...item, role, updated_at: new Date().toISOString() } : item));
      setMessage(`${member.display_name || member.email} har nå rollen ${roleLabels[role]}.`);
      window.dispatchEvent(new CustomEvent('yasaflow-organization-members-changed'));
    }
    setSavingEmail('');
  };

  if (!organizationId) return null;

  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Users size={18} /></div>
          <div><h3 className="font-serif text-lg">Organisasjonsmedlemmer og roller</h3><p className="text-xs opacity-55">{members.length} medlemmer</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Oppdater medlemmer"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(['all', 'owner', 'admin', 'staff'] as const).map((role) => (
          <button key={role} type="button" onClick={() => setFilter(role)} className="rounded-full border px-3 py-1.5 text-xs" style={{ background: filter === role ? 'var(--brand-primary)' : 'white', color: filter === role ? 'var(--brand-primary-text)' : 'var(--brand-text)', borderColor: 'var(--brand-border)' }}>
            {role === 'all' ? `Alle ${members.length}` : `${roleLabels[role]} ${counts[role]}`}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {message && <p aria-live="polite" className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
      {!error && !loading && visible.length === 0 && <p className="rounded-xl border p-4 text-center text-sm opacity-55">Ingen medlemmer å vise.</p>}

      <div className="space-y-2">
        {visible.map((member) => (
          <article key={`${member.organization_id}-${member.email}`} className="rounded-xl border p-3" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.display_name || member.email}</p>
                <p className="truncate text-xs opacity-55">{member.email}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] opacity-65">
                  <span className="flex items-center gap-1"><ShieldCheck size={13} />{statusLabel(member.invitation_status)}</span>
                  <span className="flex items-center gap-1"><UserCog size={13} />Oppdatert {dateTime(member.updated_at)}</span>
                </div>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs">
                <span className="opacity-60">Rolle</span>
                <select
                  value={member.role}
                  disabled={Boolean(savingEmail)}
                  onChange={(event) => void changeRole(member, event.target.value as OrganizationRole)}
                  className="rounded-xl border bg-white px-3 py-2 disabled:opacity-50"
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  aria-label={`Rolle for ${member.display_name || member.email}`}
                >
                  <option value="owner">Eier</option>
                  <option value="admin">Administrator</option>
                  <option value="staff">Ansatt</option>
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
