"use client";

import { useId } from "react";

export function Tabs({ tabs, value, onValueChange, ariaLabel }) {
  const id = useId();
  const activeTab = tabs.find((tab) => tab.value === value) || tabs[0];
  if (!activeTab) return null;

  function handleKeyDown(event, index) {
    const lastIndex = tabs.length - 1;
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    onValueChange(nextTab.value);
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')?.[nextIndex]?.focus();
  }

  return <div className="shadcn-tabs">
    <div className="shadcn-tabs-list" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => <button
        key={tab.value}
        id={`${id}-${tab.value}-tab`}
        type="button"
        role="tab"
        aria-selected={activeTab.value === tab.value}
        aria-controls={`${id}-${tab.value}-panel`}
        tabIndex={activeTab.value === tab.value ? 0 : -1}
        className="shadcn-tabs-trigger"
        onClick={() => onValueChange(tab.value)}
        onKeyDown={(event) => handleKeyDown(event, index)}
      >{tab.label}</button>)}
    </div>
    {tabs.map((tab) => <section
      key={tab.value}
      id={`${id}-${tab.value}-panel`}
      role="tabpanel"
      aria-labelledby={`${id}-${tab.value}-tab`}
      tabIndex={0}
      className="shadcn-tabs-content"
      hidden={activeTab.value !== tab.value}
    >{tab.content}</section>)}
  </div>;
}
