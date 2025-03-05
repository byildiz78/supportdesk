export function TRFlag({ className = "w-48 h-48" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" className={className}>
      <rect width="48" height="48" fill="#E30A17"/>
      <circle cx="16.5" cy="12" r="6" fill="#ffffff"/>
      <circle cx="18" cy="12" r="4.8" fill="#E30A17"/>
      <path d="M19.2 9.6l1.5 2-2.4.8 2.4.8-1.5 2 1.5-2-2.4-.8 2.4-.8z" fill="#ffffff"/>
    </svg>
  );
}

export function USFlag({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" className={className}>
      <rect width="36" height="24" fill="#ffffff"/>
      <g>
        <rect width="36" height="1.85" y="0" fill="#B22234"/>
        <rect width="36" height="1.85" y="3.69" fill="#B22234"/>
        <rect width="36" height="1.85" y="7.38" fill="#B22234"/>
        <rect width="36" height="1.85" y="11.08" fill="#B22234"/>
        <rect width="36" height="1.85" y="14.77" fill="#B22234"/>
        <rect width="36" height="1.85" y="18.46" fill="#B22234"/>
        <rect width="36" height="1.85" y="22.15" fill="#B22234"/>
      </g>
      <rect width="14.4" height="12.92" fill="#3C3B6E"/>
      <g fill="#ffffff">
        <circle cx="2.4" cy="2.15" r=".5"/>
        <circle cx="7.2" cy="2.15" r=".5"/>
        <circle cx="12" cy="2.15" r=".5"/>
        <circle cx="4.8" cy="4.31" r=".5"/>
        <circle cx="9.6" cy="4.31" r=".5"/>
        <circle cx="2.4" cy="6.46" r=".5"/>
        <circle cx="7.2" cy="6.46" r=".5"/>
        <circle cx="12" cy="6.46" r=".5"/>
        <circle cx="4.8" cy="8.62" r=".5"/>
        <circle cx="9.6" cy="8.62" r=".5"/>
        <circle cx="2.4" cy="10.77" r=".5"/>
        <circle cx="7.2" cy="10.77" r=".5"/>
        <circle cx="12" cy="10.77" r=".5"/>
      </g>
    </svg>
  );
}

export function SAFlag({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" className={className}>
      <rect width="36" height="24" fill="#006C35"/>
      <g transform="translate(11 6)" fill="#ffffff">
        <path d="M7 0h2v12H7z"/>
        <path d="M0 5h16v2H0z"/>
        <path d="M3.5 2.5c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H5c-.8 0-1.5-.7-1.5-1.5v-7z" fillRule="evenodd" clipRule="evenodd"/>
      </g>
    </svg>
  );
}
