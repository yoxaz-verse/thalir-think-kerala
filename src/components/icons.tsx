export function Arrow({ external = false }: { external?: boolean }) { return <span aria-hidden="true" className="arrow">{external ? "↗" : "→"}</span>; }
export function Leaf({ n = 1 }: { n?: number }) { return <span aria-hidden="true" className={`leaf leaf--${n}`}/>; }
