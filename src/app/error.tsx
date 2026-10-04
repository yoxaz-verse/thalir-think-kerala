"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="error-page"><span>!</span><h1>Something didn’t grow as planned.</h1><p>Please try the page again.</p><button className="button" onClick={reset}>Try again</button></main>; }
