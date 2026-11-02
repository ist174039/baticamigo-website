"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

/**
 * Searchable people picker. `value`/`onChange` are controlled; `defaultValue`
 * is available when the surrounding form owns the value through FormData.
 * Pass `name` to include the selected value(s) in FormData.
 */
export function SearchableSelect({
  options = [], value, defaultValue, onChange, name, ariaLabel, placeholder = "Pesquisar…",
  disabled = false, required = false, multiple = false, noOptionsText = "Não foram encontrados resultados.",
  className = "",
}) {
  const id = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? (multiple ? [] : ""));
  const selectedValue = controlled ? value : internalValue;
  const selectedValues = multiple ? (Array.isArray(selectedValue) ? selectedValue : []) : selectedValue ? [selectedValue] : [];
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));
  const selectedOption = multiple ? null : selectedOptions[0];
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-PT");
    if (!needle) return options;
    return options.filter(option => `${option.label} ${option.description || ""} ${(option.keywords || []).join(" ")}`.toLocaleLowerCase("pt-PT").includes(needle));
  }, [options, query]);
  const listboxId = `${id}-options`;
  const requiredMissing = required && selectedValues.length === 0;

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    inputRef.current?.setCustomValidity(requiredMissing ? "Escolha uma opção da lista." : "");
  }, [requiredMissing]);

  function commit(next) {
    if (!controlled) setInternalValue(next);
    onChange?.(next);
  }

  function toggleOption(option) {
    if (option.disabled || disabled) return;
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter(item => item !== option.value)
        : [...selectedValues, option.value];
      commit(next);
      setQuery("");
      setOpen(true);
      inputRef.current?.focus();
    } else {
      commit(option.value);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.min(index + 1, Math.max(0, filtered.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Home" && open && filtered.length) {
      event.preventDefault(); setActiveIndex(0);
    } else if (event.key === "End" && open && filtered.length) {
      event.preventDefault(); setActiveIndex(filtered.length - 1);
    } else if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault(); toggleOption(filtered[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault(); setOpen(false); setQuery("");
    } else if (event.key === "Backspace" && multiple && !query && selectedValues.length) {
      const next = selectedValues.slice(0, -1); commit(next);
    }
  }

  function removeOption(option) {
    if (disabled) return;
    commit(selectedValues.filter(item => item !== option.value));
    inputRef.current?.focus();
  }

  return <div ref={rootRef} className={`platform-searchable-select${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
    {name && selectedValues.map(item => <input key={item} type="hidden" name={name} value={item}/>) }
    <div className="platform-searchable-control">
      {multiple && selectedOptions.length > 0 && <div className="platform-searchable-chips" aria-label="Selecionados">
        {selectedOptions.map(option => <span className="platform-searchable-chip" key={option.value}>{option.label}<button type="button" disabled={disabled} aria-label={`Remover ${option.label}`} onClick={() => removeOption(option)}><X size={13}/></button></span>)}
      </div>}
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && filtered[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        aria-required={required || undefined}
        aria-invalid={requiredMissing || undefined}
        placeholder={multiple && selectedOptions.length ? "Adicionar outra pessoa…" : placeholder}
        disabled={disabled}
        required={requiredMissing}
        value={multiple ? query : open ? query : (selectedOption?.label || "")}
        onFocus={() => { setOpen(true); setQuery(""); setActiveIndex(0); }}
        onClick={() => { if (!open) { setOpen(true); setQuery(""); setActiveIndex(0); } }}
        onChange={event => {
          const nextQuery = event.target.value;
          setQuery(nextQuery); setOpen(true); setActiveIndex(0);
          if (!multiple && selectedValues.length) commit("");
        }}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className="platform-searchable-toggle" aria-label={open ? "Fechar opções" : "Mostrar opções"} aria-expanded={open} disabled={disabled} onClick={() => { setOpen(current => !current); if (!open) { setQuery(""); inputRef.current?.focus(); } }}><ChevronDown size={16}/></button>
      {!multiple && selectedOption && !required && <button type="button" className="platform-searchable-clear" aria-label={`Limpar ${selectedOption.label}`} disabled={disabled} onClick={() => { commit(""); setQuery(""); inputRef.current?.focus(); }}><X size={14}/></button>}
    </div>
    {open && <ul id={listboxId} className="platform-searchable-options" role="listbox" aria-label={ariaLabel} aria-multiselectable={multiple || undefined}>
      {filtered.length ? filtered.map((option, index) => {
        const selected = selectedValues.includes(option.value);
        return <li key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={selected} aria-disabled={option.disabled || undefined} className={`platform-searchable-option${index === activeIndex ? " is-active" : ""}${option.disabled ? " is-disabled" : ""}`} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => toggleOption(option)}>
          <span className="platform-searchable-option-check" aria-hidden="true">{selected && <Check size={14}/>}</span><span className="platform-searchable-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        </li>;
      }) : <li className="platform-searchable-empty" role="option" aria-disabled="true" aria-selected="false">{noOptionsText}</li>}
    </ul>}
  </div>;
}
