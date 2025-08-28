import React, { useMemo, useState, useEffect } from 'react'
import classNames from 'classnames'
import { useAppStore } from '../store/useAppStore'
import type { BusinessProfile } from '../types/business'


function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card">
      <div className="section-title mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

type Validation = { path: string; message: string }
function validate(p: BusinessProfile): Validation[] {
  const v: Validation[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.as_of_date)) v.push({ path: 'as_of_date', message: 'Invalid date (YYYY-MM-DD)' })
  if (!p.industry.naics_codes.length) v.push({ path: 'industry.naics_codes', message: 'At least one NAICS code required' })
  if (!/^[A-Z]{2}$/.test(p.locations.primary.state)) v.push({ path: 'locations.primary.state', message: 'State must be 2 letters' })
  if (!/^\d{5}(-\d{4})?$/.test(p.locations.primary.postal_code)) v.push({ path: 'locations.primary.postal_code', message: 'ZIP must be 5 digits' })
  if (p.size.employee_count_total < 0) v.push({ path: 'size.employee_count_total', message: 'Employees cannot be negative' })
  if (p.size.annual_revenue_usd !== undefined && p.size.annual_revenue_usd < 0) v.push({ path: 'size.annual_revenue_usd', message: 'Revenue cannot be negative' })
  return v
}

type DataPractices = NonNullable<BusinessProfile['data_practices']>
type DPBoolKeys =
  | 'collects_personal_data'
  | 'collects_biometric_data'
  | 'collects_payment_cards'
  | 'stores_payment_cards'
  | 'processes_phi'
  | 'processes_ssn'
  | 'targets_children_u13'

export default function BusinessProfileForm({ onSubmit }: { onSubmit: (p: BusinessProfile) => void }) {
  const profile = useAppStore(s => s.profile)
  const setProfile = useAppStore(s => s.setProfile)
  const submitting = useAppStore(s => s.submitting)

  const errors = useMemo(() => validate(profile), [profile])
  const errorMap = useMemo(() => new Map(errors.map(e => [e.path, e.message])), [errors])

  const parseStates = (raw: string) => {
    const tokens = raw
      .split(',')
      .map(s => s.trim().toUpperCase())
      // only accept complete 2-letter codes; ignore partials like "C"
      .filter(s => /^[A-Z]{2}$/.test(s));
    // de-dup while preserving order
    return Array.from(new Set(tokens));
  };
  const update = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setProfile({ [key]: value } as Partial<BusinessProfile>)
  }
  const onNAICSChange = (text: string) => {
    const codes = text.split(',').map(s => s.trim()).filter(Boolean)
    update('industry', { ...profile.industry, naics_codes: codes })
  }

  // ---- number inputs as strings (fix sticky delete) ----
  const [empStr, setEmpStr] = useState(String(profile.size.employee_count_total ?? ''))
  const [revStr, setRevStr] = useState(profile.size.annual_revenue_usd === undefined ? '' : String(profile.size.annual_revenue_usd))
  const [recStr, setRecStr] = useState(String(profile.data_practices?.records_per_year_estimate ?? ''))

  useEffect(() => { setEmpStr(String(profile.size.employee_count_total ?? '')) }, [profile.size.employee_count_total])
  useEffect(() => { setRevStr(profile.size.annual_revenue_usd === undefined ? '' : String(profile.size.annual_revenue_usd)) }, [profile.size.annual_revenue_usd])
  useEffect(() => { setRecStr(String(profile.data_practices?.records_per_year_estimate ?? '')) }, [profile.data_practices?.records_per_year_estimate])

  // ---- JSON textarea helpers (parse on blur) ----
  const [cbsStr, setCbsStr] = useState(JSON.stringify(profile.data_practices?.consumers_by_state ?? {}, null, 2))
  const [cbsErr, setCbsErr] = useState<string | null>(null)
  useEffect(() => { setCbsStr(JSON.stringify(profile.data_practices?.consumers_by_state ?? {}, null, 2)) }, [profile.data_practices?.consumers_by_state])

  const [ecsStr, setEcsStr] = useState(JSON.stringify(profile.size.employee_count_by_state ?? {}, null, 2))
  const [ecsErr, setEcsErr] = useState<string | null>(null)
  useEffect(() => { setEcsStr(JSON.stringify(profile.size.employee_count_by_state ?? {}, null, 2)) }, [profile.size.employee_count_by_state])

  const [remStr, setRemStr] = useState(JSON.stringify(profile.locations.has_remote_employees_by_state ?? {}, null, 2))
  const [remErr, setRemErr] = useState<string | null>(null)
  useEffect(() => { setRemStr(JSON.stringify(profile.locations.has_remote_employees_by_state ?? {}, null, 2)) }, [profile.locations.has_remote_employees_by_state])

  const onSubmitLocal = (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.length === 0) onSubmit(profile)
  }

  const [opsText, setOpsText] = useState(
    (profile.locations.operating_states ?? []).join(', ')
  );

  return (
    <form onSubmit={onSubmitLocal} className="space-y-4">
      <Section title="General">
        <FieldRow>
          <div>
            <div className="label">As of date</div>
            <input
              className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('as_of_date') })}
              type="date"
              value={profile.as_of_date}
              onChange={e => update('as_of_date', e.target.value as any)}
            />
            {errorMap.get('as_of_date') && <div className="text-xs text-red-600 mt-1">{errorMap.get('as_of_date')}</div>}
          </div>
          <div>
            <div className="label">Legal form</div>
            <select
              className="input w-full"
              value={profile.entity.legal_form}
              onChange={e => update('entity', { ...profile.entity, legal_form: e.target.value as any })}
            >
              <option value="llc">LLC</option>
              <option value="c_corp">C-Corp</option>
              <option value="s_corp">S-Corp</option>
              <option value="sole_prop">Sole proprietor</option>
              <option value="partnership">Partnership</option>
              <option value="nonprofit_other">Nonprofit / other</option>
            </select>
          </div>
        </FieldRow>
        <label className="block">
          <span className="label">NAICS codes (comma-separated)</span>
          <input
            className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('industry.naics_codes') })}
            value={profile.industry.naics_codes.join(', ')}
            onChange={e => onNAICSChange(e.target.value)}
            placeholder="e.g., 722511"
          />
          {errorMap.get('industry.naics_codes') && <div className="text-xs text-red-600 mt-1">{errorMap.get('industry.naics_codes')}</div>}
        </label>
        <label className="block">
          <span className="label">Industry description (optional)</span>
          <input
            className="input w-full"
            value={profile.industry.description || ''}
            onChange={e => update('industry', { ...profile.industry, description: e.target.value })}
          />
        </label>
      </Section>

      <Section title="Location">
        <FieldRow>
          <label className="block">
            <span className="label">State</span>
            <input
              className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('locations.primary.state') })}
              value={profile.locations.primary.state}
              onChange={e =>
                update('locations', { ...profile.locations, primary: { ...profile.locations.primary, state: e.target.value.toUpperCase() } })
              }
            />
            {errorMap.get('locations.primary.state') && <div className="text-xs text-red-600 mt-1">{errorMap.get('locations.primary.state')}</div>}
          </label>
          <label className="block">
            <span className="label">City</span>
            <input
              className="input w-full"
              value={profile.locations.primary.city}
              onChange={e => update('locations', { ...profile.locations, primary: { ...profile.locations.primary, city: e.target.value } })}
            />
          </label>
        </FieldRow>
        <FieldRow>
          <label className="block">
            <span className="label">Postal code</span>
            <input
              className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('locations.primary.postal_code') })}
              value={profile.locations.primary.postal_code}
              onChange={e => update('locations', { ...profile.locations, primary: { ...profile.locations.primary, postal_code: e.target.value } })}
            />
            {errorMap.get('locations.primary.postal_code') && <div className="text-xs text-red-600 mt-1">{errorMap.get('locations.primary.postal_code')}</div>}
          </label>
          <label className="block">
            <span className="label">Operating states (comma-separated)</span>
            <input
              className="input w-full"
              value={opsText}
              onChange={e => {
                const raw = e.target.value;
                setOpsText(raw); // preserve what the user typed, incl. trailing comma/space
                update('locations', {
                  ...profile.locations,
                  operating_states: parseStates(raw),
                });
              }}
              onBlur={() => {
                // normalize the display once user leaves the field
                setOpsText((profile.locations.operating_states ?? []).join(', '));
              }}
              placeholder="e.g. CA, TX, ID"
              inputMode="text"
              // optional: pattern for browser validation (won't block typing)
              pattern="^([A-Za-z]{2})(\s*,\s*[A-Za-z]{2})*$"
            />
          </label>
        </FieldRow>

        {/* Remote employees by state (JSON) */}
        <label className="block">
          <span className="label">Remote employees by state (JSON)</span>
          <textarea
            className={classNames('input w-full h-24 font-mono', { 'ring-2 ring-red-400': !!remErr })}
            spellCheck={false}
            value={remStr}
            onChange={e => { setRemErr(null); setRemStr(e.target.value) }}
            onBlur={() => {
              try {
                const parsed = remStr.trim() ? JSON.parse(remStr) : {}
                update('locations', { ...profile.locations, has_remote_employees_by_state: parsed })
                setRemStr(JSON.stringify(parsed, null, 2))
                setRemErr(null)
              } catch { setRemErr('Invalid JSON. Example: {"CA": 3}') }
            }}
            placeholder="{}"
          />
          {remErr && <div className="text-xs text-red-600 mt-1">{remErr}</div>}
        </label>
      </Section>

      <Section title="Size">
        <FieldRow>
          <label className="block">
            <span className="label">Employees (total)</span>
            <input
              className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('size.employee_count_total') })}
              type="number"
              min={0}
              value={empStr}
              onChange={e => setEmpStr(e.target.value)}
              onBlur={() => {
                const n = empStr.trim() === '' ? 0 : Math.max(0, Number(empStr))
                update('size', { ...profile.size, employee_count_total: Number.isFinite(n) ? n : 0 })
              }}
            />
            {errorMap.get('size.employee_count_total') && <div className="text-xs text-red-600 mt-1">{errorMap.get('size.employee_count_total')}</div>}
          </label>
          <label className="block">
            <span className="label">Annual revenue (USD, optional)</span>
            <input
              className={classNames('input w-full', { 'ring-2 ring-red-400': errorMap.has('size.annual_revenue_usd') })}
              type="number"
              min={0}
              value={revStr}
              onChange={e => setRevStr(e.target.value)}
              onBlur={() => {
                const n = revStr.trim() === '' ? undefined : Math.max(0, Number(revStr))
                update('size', { ...profile.size, annual_revenue_usd: n })
              }}
            />
            {errorMap.get('size.annual_revenue_usd') && <div className="text-xs text-red-600 mt-1">{errorMap.get('size.annual_revenue_usd')}</div>}
          </label>
        </FieldRow>

        {/* Employee count by state (JSON) */}
        <label className="block">
          <span className="label">Employee count by state (JSON)</span>
          <textarea
            className={classNames('input w-full h-24 font-mono', { 'ring-2 ring-red-400': !!ecsErr })}
            spellCheck={false}
            value={ecsStr}
            onChange={e => { setEcsErr(null); setEcsStr(e.target.value) }}
            onBlur={() => {
              try {
                const parsed = ecsStr.trim() ? JSON.parse(ecsStr) : {}
                update('size', { ...profile.size, employee_count_by_state: parsed })
                setEcsStr(JSON.stringify(parsed, null, 2))
                setEcsErr(null)
              } catch { setEcsErr('Invalid JSON. Example: {"CA": 15}') }
            }}
            placeholder="{}"
          />
          {ecsErr && <div className="text-xs text-red-600 mt-1">{ecsErr}</div>}
        </label>
      </Section>

      <Section title="Operations (toggle what applies)">
        <div className="flex flex-wrap gap-2">
          {([
            ['serves_food', 'Serves food'],
            ['sells_alcohol', 'Sells alcohol'],
            ['brick_and_mortar', 'Brick & mortar'],
            ['ecommerce', 'E-commerce'],
            ['is_healthcare_provider', 'Healthcare provider'],
            ['is_contractor_or_construction', 'Contractor / Construction'],
          ] as const).map(([key, label]) => {
            const value = !!profile.operations?.[key]
            return (
              <button
                type="button"
                key={key}
                className={classNames('badge', value ? 'bg-brand-50 border-brand-200 text-brand-800' : 'badge-muted')}
                onClick={() => {
                  const next = { ...(profile.operations || {}) }
                  next[key] = !value
                  update('operations', next)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Payments">
        <div className="flex flex-wrap gap-2">
          {([
            ['accepts_card_payments', 'Accepts card payments'],
            ['stores_card_data', 'Stores card data'],
          ] as const).map(([key, label]) => {
            const value = !!profile.payments?.[key]
            return (
              <button
                type="button"
                key={key}
                className={classNames('badge', value ? 'bg-brand-50 border-brand-200 text-brand-800' : 'badge-muted')}
                onClick={() => {
                  const next = { ...(profile.payments || {}) }
                  next[key] = !value
                  update('payments', next)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Privacy & Data">
        <div className="flex flex-wrap gap-2">
          {([
            ['collects_personal_data', 'Personal data'],
            ['collects_biometric_data', 'Biometric data'],
            ['collects_payment_cards', 'Collects card data'],
            ['stores_payment_cards', 'Stores card data'],
            ['processes_phi', 'Processes PHI (HIPAA)'],
            ['processes_ssn', 'Processes SSN'],
            ['targets_children_u13', 'Targets children < 13'],
          ] as ReadonlyArray<[DPBoolKeys, string]>).map(([key, label]) => {
            const value = !!profile.data_practices?.[key]
            return (
              <button
                type="button"
                key={key}
                className={classNames('badge', value ? 'bg-brand-50 border-brand-200 text-brand-800' : 'badge-muted')}
                onClick={() => {
                  const next: DataPractices = { ...(profile.data_practices || {}) }
                  next[key] = !value
                  update('data_practices', next)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <FieldRow>
          <label className="block">
            <span className="label">Records per year (estimate)</span>
            <input
              className="input w-full"
              type="number"
              min={0}
              value={recStr}
              onChange={e => setRecStr(e.target.value)}
              onBlur={() => {
                const n = recStr.trim() === '' ? undefined : Math.max(0, Number(recStr))
                update('data_practices', { ...(profile.data_practices || {}), records_per_year_estimate: n as any })
              }}
            />
          </label>
          <label className="block">
            <span className="label">Consumers by state (JSON)</span>
            <textarea
              className={classNames('input w-full h-24 font-mono', { 'ring-2 ring-red-400': !!cbsErr })}
              spellCheck={false}
              value={cbsStr}
              onChange={e => { setCbsErr(null); setCbsStr(e.target.value) }}
              onBlur={() => {
                try {
                  const parsed = cbsStr.trim() ? JSON.parse(cbsStr) : {}
                  update('data_practices', { ...(profile.data_practices || {}), consumers_by_state: parsed })
                  setCbsStr(JSON.stringify(parsed, null, 2))
                  setCbsErr(null)
                } catch { setCbsErr('Invalid JSON. Example: {"CA": 10000}') }
              }}
              placeholder="{}"
            />
            {cbsErr && <div className="text-xs text-red-600 mt-1">{cbsErr}</div>}
          </label>
        </FieldRow>
      </Section>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={errors.length > 0 || submitting}>
          {submitting ? 'Evaluating…' : 'Evaluate'}
        </button>
        {errors.length > 0 && <div className="text-sm text-red-600">{errors.length} validation issue(s). Fix above to proceed.</div>}
      </div>
    </form>
  )
}
