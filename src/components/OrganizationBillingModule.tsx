import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Puzzle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PRODUCTS = [
  { id: 'prod_21PIYy2aAeG6y2B3Zjul2a', name: 'Yasaflow Core Platform', price: '€32/mnd', description: 'Full tilgang til Yasaflow-plattformen.', kind: 'core' },
  { id: 'prod_7jeTFbEys6FrrBstowAJuL', name: 'Push-varslinger', price: '€5/mnd', description: 'Send push-varsler til medlemmer og besøkende.', kind: 'addon' },
  { id: 'prod_4DP5C2BFo9HZM8K32SqKXl', name: 'Donasjoner', price: '€4/mnd', description: 'Aktiver donasjonsmodulen for organisasjonen.', kind: 'addon' },
] as const;

type BillingState = {
  subscription_status?: string | null;
  subscription_plan?: string | null;
  creem_product_ids?: string[] | null;
};

export function OrganizationBillingModule({ organizationId }: { organizationId: string }) {
  const [billing, setBilling] = useState<BillingState>({});
  const [loading, setLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState('');
  const [error, setError] = useState('');

  const loadBilling = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('organizations')
      .select('subscription_status,subscription_plan,creem_product_ids')
      .eq('id', organizationId)
      .maybeSingle();
    if (loadError) setError(loadError.message);
    else setBilling(data || {});
    setLoading(false);
  };

  useEffect(() => { void loadBilling(); }, [organizationId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') void loadBilling();
  }, [organizationId]);

  const activeProducts = useMemo(() => new Set(billing.creem_product_ids || []), [billing.creem_product_ids]);

  const startCheckout = async (productId: string) => {
    if (!supabase || checkoutProduct) return;
    setCheckoutProduct(productId);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Du må være logget inn for å administrere betaling.');

      const response = await fetch('/api/create-creem-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          product_id: productId,
          success_url: `${window.location.origin}/admin?payment=success`,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.checkout_url) throw new Error(result.error || 'Kunne ikke åpne betalingssiden.');
      window.location.assign(result.checkout_url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Kunne ikke åpne betalingssiden.');
      setCheckoutProduct('');
    }
  };

  return <section className="rounded-3xl border bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <CreditCard size={21} style={{color:'var(--brand-primary)'}}/>
      <div>
        <h4 className="font-semibold">Abonnement og betaling</h4>
        <p className="mt-1 text-xs opacity-55">Velg grunnpakken og eventuelle tilleggsmoduler. Betalingen åpnes sikkert hos Creem.</p>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wide opacity-45">Status</p><p className="mt-1 text-sm font-semibold capitalize">{loading ? 'Henter…' : billing.subscription_status || 'Ikke aktiv'}</p></div>
        {billing.subscription_status === 'active' && <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"><CheckCircle2 size={14}/> Aktiv</span>}
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {PRODUCTS.map(product => {
        const active = activeProducts.has(product.id) || (product.kind === 'core' && billing.subscription_status === 'active');
        const busy = checkoutProduct === product.id;
        return <article key={product.id} className="flex flex-col rounded-2xl border p-4">
          <div className="flex items-start gap-2"><Puzzle size={17} style={{color:'var(--brand-primary)'}}/><div><h5 className="text-sm font-semibold">{product.name}</h5><p className="mt-1 text-xs opacity-55">{product.description}</p></div></div>
          <p className="mt-4 text-lg font-semibold">{product.price}</p>
          <button type="button" disabled={active || Boolean(checkoutProduct)} onClick={()=>void startCheckout(product.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-55" style={{background:active?'#ecfdf5':'var(--brand-primary)',color:active?'#047857':'var(--brand-primary-text)'}}>
            {busy?<Loader2 size={15} className="animate-spin"/>:active?<CheckCircle2 size={15}/>:<CreditCard size={15}/>}
            {active?'Aktiv':busy?'Åpner betaling…':'Velg og betal'}
          </button>
        </article>;
      })}
    </div>
    <p className="mt-3 text-xs opacity-50">Tilleggsmoduler kjøpes foreløpig én om gangen. Hver betaling kobles automatisk til denne organisasjonen.</p>
    {error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  </section>;
}
