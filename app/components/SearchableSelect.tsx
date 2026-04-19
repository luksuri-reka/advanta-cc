'use client';

import { useState } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export interface SelectOption {
  id: string | number;
  name: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  required = false,
  icon,
  isLoading = false
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((opt) =>
          opt.name.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <Combobox 
      value={String(value)} 
      onChange={(val) => {
        if (val !== null) onChange(val);
      }} 
      disabled={disabled || isLoading}
    >
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 z-10">
            {icon}
          </div>
        )}
        
        <ComboboxInput
          className={`block w-full rounded-xl sm:rounded-2xl border-2 py-3.5 sm:py-4 pr-12 text-sm sm:text-base font-medium transition-all duration-300 ${
            icon ? 'pl-14 sm:pl-16' : 'pl-4 sm:pl-5'
          } ${
            value
              ? 'text-slate-900 dark:text-slate-100 bg-gradient-to-r from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-500 dark:border-emerald-600 ring-4 ring-emerald-500/10 shadow-xl shadow-emerald-500/20'
              : 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 shadow-lg hover:shadow-xl'
          } focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed`}
          displayValue={(val: string) => {
            const opt = options.find((o) => String(o.id) === val);
            return opt ? opt.name : '';
          }}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isLoading ? '⏳ Memuat...' : placeholder}
          required={required && !value} // Fallback HTML validation if needed
        />

        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
          <div className={`p-1.5 rounded-lg transition-all duration-300 ${
            value ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'
          }`}>
            <ChevronUpDownIcon
              className={`h-4 sm:h-5 w-4 sm:h-5 transition-all duration-300 ${
                value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
          </div>
        </ComboboxButton>

        <ComboboxOptions
          transition
          className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 py-1 text-base shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 border border-slate-100 dark:border-slate-700"
        >
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-3 px-4 text-slate-500 dark:text-slate-400">
              Tidak ditemukan produk "{query}"
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <ComboboxOption
                key={opt.id}
                className={({ focus }) =>
                  `relative cursor-default select-none py-3 pl-10 pr-4 transition-colors ${
                    focus
                      ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                      : 'text-slate-900 dark:text-slate-100'
                  }`
                }
                value={String(opt.id)}
              >
                {({ selected, focus }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}`}>
                      {opt.name}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600 dark:text-emerald-400">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
