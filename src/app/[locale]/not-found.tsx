import Link from "next/link";
export default function NotFound() { return <main id="main" className="error-page"><span>404</span><h1>This path hasn’t taken root.</h1><p>The page may have moved, or it may still be an idea waiting to grow.</p><Link className="button" href="/en">Return home →</Link></main>; }
