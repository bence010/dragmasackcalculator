// Server-side proxy for the public playmog.xyz endpoints.
// Runs on Netlify, so the browser never talks to playmog directly and CORS never applies.
//
//   /.netlify/functions/pool?p=sack      -> Dragma's Sack: pool, global Jewels, top 100
//   /.netlify/functions/pool?p=campaign  -> Throne pool and boosted-Throne countdown
//   /.netlify/functions/pool?p=throne    -> Throne lifetime added/paid

const SOURCES = {
  sack: "https://playmog.xyz/api/valor-drop/campaign",
  campaign: "https://playmog.xyz/api/campaign",
  throne: "https://playmog.xyz/api/jackpot/pool",
};

export default async (req) => {
  const key = new URL(req.url).searchParams.get("p") || "sack";
  const target = SOURCES[key];

  const json = (body, status) =>
    new Response(JSON.stringify(body), {
      status: status || 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=45, s-maxage=45",
      },
    });

  if (!target) return json({ error: "unknown source", allowed: Object.keys(SOURCES) }, 400);

  try {
    const r = await fetch(target, { headers: { accept: "application/json" } });
    if (!r.ok) return json({ error: "upstream returned " + r.status }, 502);
    const data = await r.json();
    return json({ source: key, fetchedAt: new Date().toISOString(), data });
  } catch (e) {
    return json({ error: String(e && e.message ? e.message : e) }, 502);
  }
};
