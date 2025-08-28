import { create } from 'zustand'
import { BusinessProfile, EvaluationResponse } from '../types/business'

type AppState = {
  profile: BusinessProfile
  lastResult: EvaluationResponse | null
  lastError: string | null
  submitting: boolean
  setProfile: (p: Partial<BusinessProfile>) => void
  setFullProfile: (p: BusinessProfile) => void
  setResult: (r: EvaluationResponse | null) => void
  setError: (e: string | null) => void
  setSubmitting: (b: boolean) => void
  reset: () => void
}

const today = new Date().toISOString().slice(0,10)

const initialProfile: BusinessProfile = {
  as_of_date: today,
  entity: { legal_form: 'llc', federal_contractor: false },
  industry: { naics_codes: ['722511'], description: 'Restaurant' },
  locations: {
    primary: { country: 'US', state: 'IL', city: 'Chicago', postal_code: '60616' },
    operating_states: ['IL'],
    online_sales_states: [],
    has_remote_employees_by_state: {}
  },
  size: { employee_count_total: 8, employee_count_by_state: { IL: 8 }, annual_revenue_usd: 500000 },
  operations: { serves_food: true, sells_alcohol: false, brick_and_mortar: true, ecommerce: false, is_healthcare_provider: false, is_contractor_or_construction: false },
  payments: { accepts_card_payments: true, stores_card_data: false },
  data_practices: {
    collects_personal_data: true,
    collects_biometric_data: false,
    collects_payment_cards: true,
    stores_payment_cards: false,
    processes_phi: false,
    processes_ssn: false,
    targets_children_u13: false,
    records_per_year_estimate: 5000,
    consumers_by_state: { IL: 5000 }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: initialProfile,
  lastResult: null,
  lastError: null,
  submitting: false,
  setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
  setFullProfile: (p) => set({ profile: p }),
  setResult: (r) => set({ lastResult: r }),
  setError: (e) => set({ lastError: e }),
  setSubmitting: (b) => set({ submitting: b }),
  reset: () => set({ profile: initialProfile, lastResult: null, lastError: null, submitting: false }),
}))
