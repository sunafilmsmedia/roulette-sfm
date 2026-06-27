"use client";

import { useState, useRef, useEffect } from "react";
import { CONFIG, QUESTIONS, SEGMENTS } from "./config";

export default function Page() {
  const [screen, setScreen] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [didWin, setDidWin] = useState(false);
  const [leadType, setLeadType] = useState("gagnant");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", consent: false });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thanksMsg, setThanksMsg] = useState("");

  const canvasRef = useRef(null);
  const rotTotal = useRef(0);

  /* ---------- tracking init (Meta Pixel + Clarity) ---------- */
  useEffect(() => {
    if (CONFIG.metaPixelId && !window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", CONFIG.metaPixelId);
      window.fbq("track", "PageView");
    }
    if (CONFIG.clarityId && !window.clarity) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", CONFIG.clarityId);
    }
  }, []);

  function track(ev) {
    try { if (window.fbq) ev === "Lead" ? window.fbq("track", "Lead") : window.fbq("trackCustom", ev); } catch (e) {}
    try { if (window.clarity) window.clarity("event", ev); } catch (e) {}
  }

  /* ---------- navigation ---------- */
  function go(name) {
    if (name === "intro") {
      setQIndex(0); setAnswers({}); setDidWin(false);
      setRotation(0); rotTotal.current = 0;
      setForm({ prenom: "", nom: "", email: "", tel: "", consent: false });
      setErr("");
    }
    setScreen(name);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }

  /* ---------- quiz ---------- */
  function computeICP(ans) {
    return (
      CONFIG.icp.metiers.includes(ans.metier) &&
      CONFIG.icp.experiences.includes(ans.experience) &&
      CONFIG.icp.objectifs.includes(ans.objectif)
    );
  }
  function answer(key, val) {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      const win = computeICP(next);
      setDidWin(win);
      track("Spin");
      setScreen("wheel");
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  }

  /* ---------- roue (canvas) ---------- */
  useEffect(() => {
    if (screen !== "wheel") return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const S = 320;
    c.width = S * dpr; c.height = S * dpr;
    c.style.width = S + "px"; c.style.height = S + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = S / 2, cy = S / 2, R = S / 2, n = SEGMENTS.length, ang = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const start = -Math.PI / 2 - ang / 2 + i * ang;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, start, start + ang); ctx.closePath();
      ctx.fillStyle = SEGMENTS[i].win
        ? (i % 4 === 0 ? "#f5c451" : "#e7b53d")
        : (i % 2 === 0 ? "#15203f" : "#1b2a52");
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(start + ang / 2);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = SEGMENTS[i].win ? "#1a1300" : "#cdd9ff";
      ctx.font = (SEGMENTS[i].win ? "bold " : "600 ") + "13px -apple-system,Arial";
      ctx.fillText(SEGMENTS[i].label, R - 16, 0);
      ctx.restore();
    }
  }, [screen]);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    const ang = 360 / SEGMENTS.length;
    const pool = SEGMENTS.map((s, i) => i).filter((i) =>
      didWin ? SEGMENTS[i].win : !SEGMENTS[i].win
    );
    const target = pool[Math.floor(Math.random() * pool.length)];
    const desired = (((360 - target * ang) % 360) + 360) % 360;
    const base = Math.ceil(rotTotal.current / 360) * 360;
    rotTotal.current = base + 360 * 6 + desired;
    setRotation(rotTotal.current);
    setTimeout(() => {
      track(didWin ? "Win" : "Lose");
      setScreen(didWin ? "win" : "lose");
      setSpinning(false);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }, 5400);
  }

  /* ---------- formulaire ---------- */
  function openForm(type) {
    setLeadType(type);
    setErr("");
    go("form");
  }
  async function submitForm() {
    const prenom = form.prenom.trim();
    const email = form.email.trim();
    if (!prenom || !email || !email.includes("@")) {
      setErr("Prénom et courriel valide requis.");
      return;
    }
    if (!form.consent) {
      setErr("Merci de cocher la case de consentement.");
      return;
    }
    setErr("");
    setSubmitting(true);

    const payload = {
      prenom,
      nom: form.nom.trim(),
      email,
      telephone: form.tel.trim(),
      metier: answers.metier,
      experience: answers.experience,
      objectif: answers.objectif,
      resultat: leadType, // "gagnant" | "perdant_interesse"
      icp_match: didWin,
      prix: "Logiciel AI gratuit + 50% rabais",
      marque: CONFIG.marque,
      source: "roulette",
      page: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      const k = "roulette_leads";
      const a = JSON.parse(localStorage.getItem(k) || "[]");
      a.push(payload);
      localStorage.setItem(k, JSON.stringify(a));
    } catch (e) {}

    track("Lead");

    const finish = () => {
      setThanksMsg(
        leadType === "gagnant"
          ? "Ton prix s'en vient par courriel 📩. Vérifie tes spams au cas où !"
          : "On te contacte très vite pour te montrer le système 🚀. Surveille tes courriels."
      );
      setSubmitting(false);
      go("thanks");
    };

    if (CONFIG.webhookUrl) {
      try {
        await fetch(CONFIG.webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {}
      finish();
    } else {
      console.log("[ROULETTE] Pas de webhook configuré. Lead capturé localement :", payload);
      finish();
    }
  }

  const q = QUESTIONS[qIndex];

  return (
    <div className="wrap">
      <div className="card">
        <div className="fade" key={screen + qIndex}>

          {/* ---------- INTRO ---------- */}
          {screen === "intro" && (
            <section>
              <span className="eyebrow">🎰 Le jeu qui qualifie</span>
              <h1>
                Tourne la roue.<br />
                <span className="hl">30% de chance</span> de gagner un logiciel AI qui remplit ton agenda de clients.
              </h1>
              <p>
                Réponds à 3 petites questions, tourne la roue, et découvre en 30 secondes si tu fais partie des
                gagnants. Aucun achat requis.
              </p>
              <button className="btn" onClick={() => go("quiz")}>Jouer maintenant 🎯</button>
              <div className="teaser">
                Pssst… ce petit jeu <b>est</b> une démo. Joue jusqu'au bout, tu vas comprendre. 👀
              </div>
            </section>
          )}

          {/* ---------- QUIZ ---------- */}
          {screen === "quiz" && (
            <section>
              <div className="progress">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i <= qIndex ? "on" : ""} />
                ))}
              </div>
              <div className="q-label">{q.label}</div>
              <h2>{q.titre}</h2>
              {q.options.map((o) => (
                <button key={o.val} className="opt" onClick={() => answer(q.key, o.val)}>
                  <span className="ico">{o.ico}</span>
                  <span>{o.txt}</span>
                </button>
              ))}
            </section>
          )}

          {/* ---------- WHEEL ---------- */}
          {screen === "wheel" && (
            <section>
              <h2 className="center">Tes réponses sont entrées.</h2>
              <p className="center">La roue connaît déjà ta réponse… 🔮</p>
              <div className="wheel-stage">
                <div className="pointer" />
                <canvas
                  ref={canvasRef}
                  className="wheel"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
                <div className="hub">🎁</div>
              </div>
              <button className="btn" disabled={spinning} onClick={spin}>
                {spinning ? "La roue tourne…" : "TOURNER LA ROUE 🎡"}
              </button>
            </section>
          )}

          {/* ---------- WIN ---------- */}
          {screen === "win" && (
            <section>
              <div className="result-emoji">🎉</div>
              <h2 className="center">
                Félicitations — tu as <span style={{ color: "var(--gold)" }}>GAGNÉ&nbsp;!</span>
              </h2>
              <div className="prize-box" dangerouslySetInnerHTML={{ __html: CONFIG.prixHTML }} />
              <p className="center small">
                Pour réclamer ton prix, entre tes infos ci-dessous. On t'envoie l'accès directement. 👇
              </p>
              <button className="btn" onClick={() => openForm("gagnant")}>Réclamer mon prix 🏆</button>
              <div className="edu" style={{ marginTop: 18 }}>
                <p style={{ margin: 0 }}>
                  <b>En passant…</b> ce que tu viens de jouer — le quiz, la roue, le résultat — <b>c'est un logiciel.</b> Le
                  même genre de système peut transformer <b>n'importe quelle offre</b> en jeu auquel tes prospects veulent
                  jouer.
                </p>
              </div>
            </section>
          )}

          {/* ---------- LOSE ---------- */}
          {screen === "lose" && (
            <section>
              <div className="result-emoji">🙃</div>
              <h2 className="center">Pas le prix cette fois… mais lis ça 👇</h2>
              <div className="edu">
                <p>
                  <b>Ce que tu viens de vivre — le quiz, la roue, ton résultat — c'est UN LOGICIEL.</b>
                </p>
                <p style={{ margin: 0 }}>
                  Le même genre de logiciel peut transformer <b>n'importe quelle offre</b> en jeu auquel tes prospects{" "}
                  <b>veulent</b> jouer. Imagine tes futurs clients qui se qualifient eux-mêmes… pendant que tu dors.
                </p>
              </div>
              <div className="prize-box">
                Tu veux le <b>même système</b> pour TON business —<br />+ du contenu et de la pub payante qui amène le
                trafic ?
              </div>
              <button className="btn" onClick={() => openForm("perdant_interesse")}>Oui, montre-moi comment 🚀</button>
              <button className="btn ghost" onClick={() => go("intro")}>Non merci, rejouer</button>
            </section>
          )}

          {/* ---------- FORM ---------- */}
          {screen === "form" && (
            <section>
              <h2>{leadType === "gagnant" ? "🏆 Réclame ton prix" : "🚀 Reçois le système"}</h2>
              <p className="small">
                {leadType === "gagnant"
                  ? "Entre tes infos, on t'envoie ton accès immédiatement."
                  : "Le logiciel + le contenu + la pub. On te montre comment, sans engagement."}
              </p>
              <div className="field">
                <label>Prénom</label>
                <input value={form.prenom} autoComplete="given-name" placeholder="Sylvain"
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div className="field">
                <label>Nom</label>
                <input value={form.nom} autoComplete="family-name" placeholder="Tremblay"
                  onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="field">
                <label>Courriel</label>
                <input value={form.email} type="email" inputMode="email" autoComplete="email" placeholder="sylvain@exemple.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input value={form.tel} type="tel" inputMode="tel" autoComplete="tel" placeholder="(514) 000-0000"
                  onChange={(e) => setForm({ ...form, tel: e.target.value })} />
              </div>
              {err && <div className="err">{err}</div>}
              <label className="consent">
                <input type="checkbox" checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>J'accepte d'être contacté(e) par courriel/téléphone au sujet de cette offre.</span>
              </label>
              <button className="btn" disabled={submitting} onClick={submitForm}>
                {submitting ? "Envoi…" : "Confirmer ✅"}
              </button>
            </section>
          )}

          {/* ---------- THANKS ---------- */}
          {screen === "thanks" && (
            <section className="center">
              <div className="result-emoji">✅</div>
              <h2>C'est noté&nbsp;!</h2>
              <p>{thanksMsg}</p>
              <button className="btn ghost" onClick={() => go("intro")}>Rejouer 🔁</button>
            </section>
          )}

        </div>
        <div className="foot">© {new Date().getFullYear()} — Démo propulsée par un logiciel de qualification.</div>
      </div>
    </div>
  );
}
