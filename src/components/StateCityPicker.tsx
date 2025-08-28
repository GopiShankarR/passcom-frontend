import React, { useMemo } from "react";
import { State, City } from "country-state-city";

type Props = {
  stateCode: string;                 // e.g. "CA"
  city?: string;                     // e.g. "Los Angeles"
  onChange: (patch: { state?: string; city?: string }) => void;
  disabled?: boolean;
};

const US = "US";

const StateCityPicker: React.FC<Props> = ({ stateCode, city, onChange, disabled }) => {
  const states = useMemo(
    () =>
      State.getStatesOfCountry(US).map(s => ({
        code: s.isoCode,            // "CA"
        name: s.name,               // "California"
      })),
    []
  );

  const cities = useMemo(
    () =>
      stateCode
        ? City.getCitiesOfState(US, stateCode).map(c => c.name) // ["Los Angeles", ...]
        : [],
    [stateCode]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="block">
        <span className="label">State</span>
        <select
          className="input w-full"
          value={stateCode || ""}
          disabled={disabled}
          onChange={e => {
            const nextState = e.target.value;
            onChange({ state: nextState, city: "" }); // reset city when state changes
          }}
        >
          <option value="" disabled>Select a state…</option>
          {states.map(s => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="label">City</span>
        <select
          className="input w-full"
          value={city || ""}
          disabled={!stateCode || disabled}
          onChange={e => onChange({ city: e.target.value })}
        >
          {!stateCode ? (
            <option value="" disabled>Select state first</option>
          ) : cities.length === 0 ? (
            <option value="" disabled>No cities found</option>
          ) : (
            <>
              <option value="">— Select a city —</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </>
          )}
        </select>
      </label>
    </div>
  );
};

export default StateCityPicker;
