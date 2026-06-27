"use client";

import { useState, useRef, useEffect } from "react";
import { CONFIG, QUESTIONS, POCKETS } from "./config";

/* ---- géométrie de la roue (px) ---- */
const S = 340, R = S / 2, CX = S / 2, CY = S / 2;
const P_OUT = R * 0.83, P_IN = R * 0.46;     // anneau des cases colorées
const NUM_R = P_OUT * 0.86;                   // rayon des numéros
const TRACK_R = R * 0.895;                    // orbite de la bille (piste)
const REST_R = R * 0.70;                      // bille au repos dans une case
const BALL = 6.5;

export default function Page() {
  const [screen, setScreen] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [didWin, setDidWin] = useState(false);
  const [leadType, setLeadType] = useState("gagnant");
  const [spinning, setSpinning] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", consent: false });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thanksMsg, setThanksMsg] = useState("");

  const canvasRef = useRef(null);
  const wheelDeg = useRef(0);
  const ballDeg = useRef(-90);
  const ballRad = useRef(TRACK_R);
  const rafRef = useRef(0);

  /* ---------- tracking init (Meta Pixel + Clarity) ---------- */
  useEffect(() => {
    if (CONFIG.metaPixelId && !window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
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

  /* =================================================================
     DESSIN DE LA ROULETTE (canvas)
     ================================================================= */
  function paint() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== S * dpr) {
      c.width = S * dpr; c.height = S * dpr;
      c.style.width = S + "px"; c.style.height = S + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);

    drawBowl(ctx);

    // tête de roue (cases + numéros + moyeu) — tourne
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate((wheelDeg.current * Math.PI) / 180);
    drawHead(ctx);
    ctx.restore();

    drawBall(ctx);
  }

  function drawBowl(ctx) {
    // socle / bezel foncé
    const bz = ctx.createRadialGradient(CX, CY, R * 0.78, CX, CY, R);
    bz.addColorStop(0, "#1c140d"); bz.addColorStop(.62, "#0c0907"); bz.addColorStop(1, "#040303");
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.fillStyle = bz; ctx.fill();
    // piste dorée (fixe) où roule la bille
    const tg = ctx.createRadialGradient(CX, CY, R * 0.84, CX, CY, R * 0.955);
    tg.addColorStop(0, "#6b4f1c"); tg.addColorStop(.45, "#d9b65a"); tg.addColorStop(.55, "#f3da8c"); tg.addColorStop(1, "#6e501c");
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.955, 0, 7); ctx.fillStyle = tg; ctx.fill();
    // liseré brillant
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.955, 0, 7); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,240,200,.5)"; ctx.stroke();
    // creux intérieur de la piste
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.84, 0, 7); ctx.fillStyle = "#070504"; ctx.fill();
  }

  function drawHead(ctx) {
    const n = POCKETS.length, step = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 - step / 2 + i * step;
      const a1 = a0 + step;
      ctx.beginPath();
      ctx.arc(0, 0, P_OUT, a0, a1);
      ctx.arc(0, 0, P_IN, a1, a0, true);
      ctx.closePath();
      const p = POCKETS[i];
      const g = ctx.createRadialGradient(0, 0, P_IN, 0, 0, P_OUT);
      if (p.win) { g.addColorStop(0, "#f7e08b"); g.addColorStop(1, "#c9982a"); }
      else if (p.color === "red") { g.addColorStop(0, "#d8232f"); g.addColorStop(1, "#6e0c12"); }
      else { g.addColorStop(0, "#26262f"); g.addColorStop(1, "#08080c"); }
      ctx.fillStyle = g; ctx.fill();

      // numéro / cadeau
      const mid = a0 + step / 2;
      ctx.save();
      ctx.translate(Math.cos(mid) * NUM_R, Math.sin(mid) * NUM_R);
      ctx.rotate(mid + Math.PI / 2);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (p.win) { ctx.font = "16px Arial"; ctx.fillText("🎁", 0, 0); }
      else {
        ctx.fillStyle = "#f6efe0";
        ctx.font = "bold 13px Georgia, 'Times New Roman', serif";
        ctx.fillText(String(p.num), 0, 0);
      }
      ctx.restore();
    }
    // séparateurs (frettes) + studs dorés
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 - step / 2 + i * step;
      const c0 = Math.cos(a), s0 = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(c0 * P_IN, s0 * P_IN);
      ctx.lineTo(c0 * P_OUT, s0 * P_OUT);
      ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(244,220,150,.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(c0 * P_OUT, s0 * P_OUT, 2.3, 0, 7);
      ctx.fillStyle = "#f3da8c"; ctx.fill();
    }
    // moyeu central (turret dorée)
    const hg = ctx.createRadialGradient(0, -R * 0.12, R * 0.04, 0, 0, P_IN);
    hg.addColorStop(0, "#f7e08b"); hg.addColorStop(.5, "#caa544"); hg.addColorStop(1, "#7c5a1f");
    ctx.beginPath(); ctx.arc(0, 0, P_IN, 0, 7); ctx.fillStyle = hg; ctx.fill();
    // rayons
    for (let k = 0; k < 8; k++) {
      ctx.save(); ctx.rotate((k * Math.PI) / 4);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.04);
      ctx.quadraticCurveTo(R * 0.05, -R * 0.26, 0, -P_IN * 0.94);
      ctx.quadraticCurveTo(-R * 0.05, -R * 0.26, 0, -R * 0.04);
      ctx.fillStyle = "rgba(255,240,200,.22)"; ctx.fill();
      ctx.restore();
    }
    // capuchon central
    const cap = ctx.createRadialGradient(-3, -3, 1, 0, 0, R * 0.13);
    cap.addColorStop(0, "#fff4cf"); cap.addColorStop(.6, "#e0b94f"); cap.addColorStop(1, "#8a6a1f");
    ctx.beginPath(); ctx.arc(0, 0, R * 0.13, 0, 7); ctx.fillStyle = cap; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.045, 0, 7); ctx.fillStyle = "#5a4416"; ctx.fill();
  }

  function drawBall(ctx) {
    const rad = (ballDeg.current * Math.PI) / 180;
    const bx = CX + ballRad.current * Math.cos(rad);
    const by = CY + ballRad.current * Math.sin(rad);
    ctx.beginPath(); ctx.arc(bx + 1, by + 2, BALL, 0, 7);
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fill();
    const bg = ctx.createRadialGradient(bx - 2.2, by - 2.2, .6, bx, by, BALL + 1);
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(.45, "#e8e8ec"); bg.addColorStop(1, "#8f8f98");
    ctx.beginPath(); ctx.arc(bx, by, BALL, 0, 7); ctx.fillStyle = bg; ctx.fill();
  }

  /* repeindre quand on entre sur l'écran roue */
  useEffect(() => {
    if (screen === "wheel") {
      wheelDeg.current = wheelDeg.current % 360;
      ballDeg.current = -90;
      ballRad.current = TRACK_R;
      paint();
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  /* =================================================================
     SPIN — physique de décélération, résultat piloté par l'ICP
     ================================================================= */
  function spin() {
    if (spinning) return;
    setSpinning(true);
    const n = POCKETS.length, step = 360 / n;
    const pool = POCKETS.map((p, i) => i).filter((i) => (didWin ? POCKETS[i].win : !POCKETS[i].win));
    const target = pool[Math.floor(Math.random() * pool.length)];
    const desired = (((360 - target * step) % 360) + 360) % 360;

    const wFrom = wheelDeg.current;
    const wTo = Math.ceil(wFrom / 360) * 360 + 360 * 5 + desired; // 5 tours + alignement
    const bFrom = ballDeg.current;
    const bTo = -90 - 360 * 11; // bille en sens inverse, finit en haut (sous le repère)

    const dur = 7200, t0 = performance.now();
    const dropStart = 0.60;
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const easeW = 1 - Math.pow(1 - p, 3.2);
      const easeB = 1 - Math.pow(1 - p, 2.4);
      wheelDeg.current = wFrom + (wTo - wFrom) * easeW;
      ballDeg.current = bFrom + (bTo - bFrom) * easeB;
      if (p < dropStart) {
        ballRad.current = TRACK_R;
      } else {
        const q = (p - dropStart) / (1 - dropStart);
        const e = 1 - Math.pow(1 - q, 2);
        // petit rebond avant de se caler
        const bounce = Math.sin(q * Math.PI * 2) * (1 - q) * (R * 0.012);
        ballRad.current = TRACK_R + (REST_R - TRACK_R) * e + bounce;
      }
      paint();
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        track(didWin ? "Win" : "Lose");
        setTimeout(() => {
          setScreen(didWin ? "win" : "lose");
          setSpinning(false);
          if (typeof window !== "undefined") window.scrollTo(0, 0);
        }, 800);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  /* ---------- navigation ---------- */
  function go(name) {
    if (name === "intro") {
      setQIndex(0); setAnswers({}); setDidWin(false);
      wheelDeg.current = 0; ballDeg.current = -90; ballRad.current = TRACK_R;
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
      setDidWin(computeICP(next));
      track("Spin");
      setScreen("wheel");
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  }

  /* ---------- formulaire ---------- */
  function openForm(type) { setLeadType(type); setErr(""); go("form"); }
  async function submitForm() {
    const prenom = form.prenom.trim();
    const email = form.email.trim();
    if (!prenom || !email || !email.includes("@")) { setErr("Prénom et courriel valide requis."); return; }
    if (!form.consent) { setErr("Merci de cocher la case de consentement."); return; }
    setErr(""); setSubmitting(true);

    const payload = {
      prenom, nom: form.nom.trim(), email, telephone: form.tel.trim(),
      metier: answers.metier, experience: answers.experience, objectif: answers.objectif,
      resultat: leadType, icp_match: didWin,
      prix: "Logiciel AI gratuit + 50% rabais", marque: CONFIG.marque, source: "roulette",
      page: typeof window !== "undefined" ? window.location.href : "",
    };
    try {
      const k = "roulette_leads";
      const a = JSON.parse(localStorage.getItem(k) || "[]");
      a.push(payload); localStorage.setItem(k, JSON.stringify(a));
    } catch (e) {}
    track("Lead");

    const finish = () => {
      setThanksMsg(
        leadType === "gagnant"
          ? "Ton prix s'en vient par courriel 📩. Vérifie tes spams au cas où !"
          : "On te contacte très vite pour te montrer le système 🚀. Surveille tes courriels."
      );
      setSubmitting(false); go("thanks");
    };

    if (CONFIG.webhookUrl) {
      try {
        await fetch(CONFIG.webhookUrl, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
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

          {/* INTRO */}
          {screen === "intro" && (
            <section>
              <span className="eyebrow">★ La Roue de la Fortune ★</span>
              <h1>Tourne la roue.<br /><span className="hl">30% de chance</span> de gagner un logiciel AI qui remplit ton agenda.</h1>
              <p>Réponds à 3 questions, lance la bille, et découvre en 30 secondes si la chance est de ton côté. Aucun achat requis.</p>
              <button className="btn" onClick={() => go("quiz")}>Jouer maintenant 🎯</button>
              <div className="teaser">Pssst… ce petit jeu <b>est</b> une démo. Joue jusqu'au bout, tu vas comprendre. 👀</div>
            </section>
          )}

          {/* QUIZ */}
          {screen === "quiz" && (
            <section>
              <div className="progress">{[0, 1, 2].map((i) => (<span key={i} className={i <= qIndex ? "on" : ""} />))}</div>
              <div className="q-label">{q.label}</div>
              <h2>{q.titre}</h2>
              {q.options.map((o) => (
                <button key={o.val} className="opt" onClick={() => answer(q.key, o.val)}>
                  <span className="ico">{o.ico}</span><span>{o.txt}</span>
                </button>
              ))}
            </section>
          )}

          {/* WHEEL */}
          {screen === "wheel" && (
            <section>
              <h2 className="center">Place tes mises.</h2>
              <p className="center">La bille connaît déjà ta réponse… 🔮</p>
              <div className="wheel-stage">
                <div className="pointer" />
                <canvas ref={canvasRef} className="wheel" />
              </div>
              <button className="btn" disabled={spinning} onClick={spin}>
                {spinning ? "La bille tourne…" : "LANCER LA BILLE 🎡"}
              </button>
            </section>
          )}

          {/* WIN */}
          {screen === "win" && (
            <section>
              <div className="result-emoji">🎉</div>
              <h2 className="center win-title">Félicitations — tu as <span style={{ color: "var(--gold-lt)" }}>GAGNÉ&nbsp;!</span></h2>
              <div className="prize-box" dangerouslySetInnerHTML={{ __html: CONFIG.prixHTML }} />
              <p className="center small">Pour réclamer ton prix, entre tes infos ci-dessous. On t'envoie l'accès directement. 👇</p>
              <button className="btn" onClick={() => openForm("gagnant")}>Réclamer mon prix 🏆</button>
              <div className="edu" style={{ marginTop: 18 }}>
                <p style={{ margin: 0 }}><b>En passant…</b> ce que tu viens de jouer — le quiz, la roue, le résultat — <b>c'est un logiciel.</b> Le même genre de système peut transformer <b>n'importe quelle offre</b> en jeu auquel tes prospects veulent jouer.</p>
              </div>
            </section>
          )}

          {/* LOSE */}
          {screen === "lose" && (
            <section>
              <div className="result-emoji">🙃</div>
              <h2 className="center">Pas le prix cette fois… mais lis ça 👇</h2>
              <div className="edu">
                <p><b>Ce que tu viens de vivre — le quiz, la roue, ton résultat — c'est UN LOGICIEL.</b></p>
                <p style={{ margin: 0 }}>Le même genre de logiciel peut transformer <b>n'importe quelle offre</b> en jeu auquel tes prospects <b>veulent</b> jouer. Imagine tes futurs clients qui se qualifient eux-mêmes… pendant que tu dors.</p>
              </div>
              <div className="prize-box">Tu veux le <b>même système</b> pour TON business —<br />+ du contenu et de la pub payante qui amène le trafic ?</div>
              <button className="btn" onClick={() => openForm("perdant_interesse")}>Oui, montre-moi comment 🚀</button>
              <button className="btn ghost" onClick={() => go("intro")}>Non merci, rejouer</button>
            </section>
          )}

          {/* FORM */}
          {screen === "form" && (
            <section>
              <h2>{leadType === "gagnant" ? "🏆 Réclame ton prix" : "🚀 Reçois le système"}</h2>
              <p className="small">{leadType === "gagnant" ? "Entre tes infos, on t'envoie ton accès immédiatement." : "Le logiciel + le contenu + la pub. On te montre comment, sans engagement."}</p>
              <div className="field"><label>Prénom</label><input value={form.prenom} autoComplete="given-name" placeholder="Sylvain" onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
              <div className="field"><label>Nom</label><input value={form.nom} autoComplete="family-name" placeholder="Tremblay" onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
              <div className="field"><label>Courriel</label><input value={form.email} type="email" inputMode="email" autoComplete="email" placeholder="sylvain@exemple.com" onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="field"><label>Téléphone</label><input value={form.tel} type="tel" inputMode="tel" autoComplete="tel" placeholder="(514) 000-0000" onChange={(e) => setForm({ ...form, tel: e.target.value })} /></div>
              {err && <div className="err">{err}</div>}
              <label className="consent"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /><span>J'accepte d'être contacté(e) par courriel/téléphone au sujet de cette offre.</span></label>
              <button className="btn" disabled={submitting} onClick={submitForm}>{submitting ? "Envoi…" : "Confirmer ✅"}</button>
            </section>
          )}

          {/* THANKS */}
          {screen === "thanks" && (
            <section className="center">
              <div className="result-emoji">✅</div>
              <h2>C'est noté&nbsp;!</h2>
              <p>{thanksMsg}</p>
              <button className="btn ghost" onClick={() => go("intro")}>Rejouer 🔁</button>
            </section>
          )}

        </div>
        <div className="foot">© {new Date().getFullYear()} — {CONFIG.marque} · Démo propulsée par un logiciel de qualification</div>
      </div>
    </div>
  );
}
