import React from 'react';

export default function TabButton({
  active,
  onClick,
  label,
  children,
  disabled,
  title,
  id,
  controls,
}) {
  return (
    <button
      type="button"
      id={id}
      className={`cd-tab ${active ? 'active' : ''}`}
      role="tab"
      aria-selected={!!active}
      aria-controls={controls}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {label ?? children}
    </button>
  );
}
