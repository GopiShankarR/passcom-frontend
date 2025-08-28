import React, { useMemo } from "react";
import { State } from "country-state-city";

type Props = {
  value: string[];                               // ["CA","TX"]
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

const US = "US";

const StatesMultiSelect: React.FC<Props> = ({ value, onChange, disabled }) => {
  const states = useMemo(
    () =>
      State.getStatesOfCountry(US).map(s => ({ code: s.isoCode, name: s.name })),
    []
  );

  const toggle = (code: string) => {
    const set = new Set(value);
    set.has(code) ? set.delete(code) : set.add(code);
    onChange(Array.from(set));
  };

  return (
    <div className="border rounded-xl p-3">
      <div className="mb-2 text-sm text-gray-700">Operating states</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-auto pr-1">
        {states.map(s => {
          const checked = value.includes(s.code);
          return (
            <label key={s.code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                disabled={disabled}
                checked={checked}
                onChange={() => toggle(s.code)}
              />
              <span className="text-sm">{s.name} ({s.code})</span>
            </label>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">Selected: {value.join(", ")}</div>
      )}
    </div>
  );
};

export default StatesMultiSelect;
