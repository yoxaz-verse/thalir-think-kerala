export function Arrow({ external = false }: { external?: boolean }) {
  return <span aria-hidden="true" className="arrow">{external ? "↗" : "→"}</span>;
}

export function Leaf({ n = 1 }: { n?: number }) {
  return <span aria-hidden="true" className={`leaf leaf--${n}`}/>;
}

export function RoleIcon({ role }: { role: string }) {
  switch (role) {
    case "founder":
      // Sprout / Rocket growth icon
      return (
        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v8" />
          <path d="M12 10C7 10 3 14 3 19h18c0-5-4-9-9-9Z" />
          <path d="M12 6a4 4 0 0 1 4-4" />
        </svg>
      );
    case "investor":
      // Capital / Growth chart icon
      return (
        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 20h18" />
          <path d="M5 16l5-6 4 4 6-8" />
          <path d="M15 6h5v5" />
        </svg>
      );
    case "mentor":
      // Compass / Guidance icon
      return (
        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "institution":
      // Landmark / Academy building icon
      return (
        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V10" />
          <path d="M19 21V10" />
          <path d="M9 21V10" />
          <path d="M15 21V10" />
          <path d="M2 10l10-7 10 7" />
        </svg>
      );
    case "partner":
      // Handshake / Network icon
      return (
        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 11l2 2a3 3 0 0 0 4.24-4.24l-3-3" />
          <path d="M8 11l-2 2a3 3 0 0 1-4.24-4.24l3-3" />
          <path d="M13 6l3 3-7 7-3-3 7-7z" />
        </svg>
      );
    default:
      return null;
  }
}
