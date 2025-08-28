export type TwoLetterState = string // 'IL', 'CA', etc.

export type BusinessProfile = {
  as_of_date: string
  entity: {
    legal_form: 'llc'|'c_corp'|'s_corp'|'sole_prop'|'partnership'|'nonprofit_other'
    federal_contractor?: boolean
  }
  industry: {
    naics_codes: string[]
    description?: string
  }
  locations: {
    primary: { country: 'US', state: TwoLetterState, city: string, postal_code: string }
    operating_states?: TwoLetterState[]
    online_sales_states?: TwoLetterState[]
    has_remote_employees_by_state?: Record<TwoLetterState, number>
  }
  size: {
    employee_count_total: number
    employee_count_by_state?: Record<TwoLetterState, number>
    annual_revenue_usd?: number
  }
  operations?: {
    serves_food?: boolean
    sells_alcohol?: boolean
    brick_and_mortar?: boolean
    ecommerce?: boolean
    is_healthcare_provider?: boolean
    is_contractor_or_construction?: boolean
  }
  payments?: {
    accepts_card_payments?: boolean
    stores_card_data?: boolean
  }
  data_practices?: {
    collects_personal_data?: boolean
    collects_biometric_data?: boolean
    collects_payment_cards?: boolean
    stores_payment_cards?: boolean
    processes_phi?: boolean
    processes_ssn?: boolean
    targets_children_u13?: boolean
    records_per_year_estimate?: number
    consumers_by_state?: Record<TwoLetterState, number>
  }
}

export type Obligation = {
  action: string
  description: string
  ruleId: string
  ruleTitle: string
}

export type Hit = {
  ruleId: string
  title: string
  why: any
}

export type EvaluationResponse = {
  obligations: Obligation[]
  hits: Hit[]
  derived: Record<string, any>
}

export type HealthStatus = {
  ok: boolean
  version: string
  ruleset: string
}
