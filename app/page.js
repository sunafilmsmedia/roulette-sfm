"use client";

import { useState, useRef, useEffect } from "react";
import { CONFIG, QUESTIONS, POCKETS } from "./config";

/* ---- géométrie de la roue (px) ---- */
const S = 340, R = S / 2, CX = S / 2, CY = S / 2;
const P_OUT = R * 0.78, P_IN = R * 0.44;     // anneau des cases colorées
const NUM_R = P_OUT * 0.87;                   // rayon des numéros
const TRACK_R = R * 0.82;                     // orbite de la bille (piste laiton)
const REST_R = R * 0.66;                      // bille au repos dans une case
const BALL = 6;

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

    // tête de roue (cases + numéros + tourelle) — tourne
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate((wheelDeg.current * Math.PI) / 180);
    drawHead(ctx);
    ctx.restore();

    drawGloss(ctx);
    drawBall(ctx);
  }

  function drawBowl(ctx) {
    // --- bol en bois verni ---
    const wd = ctx.createRadialGradient(CX, CY, R * 0.55, CX, CY, R);
    wd.addColorStop(0, "#241408");
    wd.addColorStop(.78, "#3a2310");
    wd.addColorStop(.88, "#7a4f28");
    wd.addColorStop(.93, "#542f17");
    wd.addColorStop(1, "#1b0f07");
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.fillStyle = wd; ctx.fill();
    // reflet spéculaire (haut-gauche) pour le verni
    const sp = ctx.createRadialGradient(CX - R * 0.34, CY - R * 0.42, R * 0.04, CX - R * 0.30, CY - R * 0.36, R * 0.85);
    sp.addColorStop(0, "rgba(255,228,185,.20)"); sp.addColorStop(.5, "rgba(255,200,150,.05)"); sp.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.985, 0, 7); ctx.fillStyle = sp; ctx.fill();

    // --- jante laiton (piste de la bille, fixe) ---
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.87, 0, 7); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.stroke();
    const tg = ctx.createRadialGradient(CX, CY, R * 0.79, CX, CY, R * 0.865);
    tg.addColorStop(0, "#6e521d"); tg.addColorStop(.4, "#b9923f"); tg.addColorStop(.52, "#f0d489"); tg.addColorStop(.62, "#c79c46"); tg.addColorStop(1, "#5d441a");
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.865, 0, 7); ctx.fillStyle = tg; ctx.fill();
    // liseré brillant + ombre interne (lèvre bankée)
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.865, 0, 7); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,244,210,.55)"; ctx.stroke();
    const sh = ctx.createRadialGradient(CX, CY, R * 0.79, CX, CY, R * 0.83);
    sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.83, 0, 7); ctx.fillStyle = sh; ctx.fill();
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
      if (p.color === "green") { g.addColorStop(0, "#2bbd6b"); g.addColorStop(1, "#0a5128"); }
      else if (p.color === "red") { g.addColorStop(0, "#d8232f"); g.addColorStop(1, "#5e0a10"); }
      else { g.addColorStop(0, "#2a2a33"); g.addColorStop(1, "#070709"); }
      ctx.fillStyle = g; ctx.fill();
      // biseau : liseré clair sur l'arc extérieur, ombre sur l'intérieur
      ctx.beginPath(); ctx.arc(0, 0, P_OUT - 1.2, a0 + .03, a1 - .03);
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.stroke();

      // numéro / cadeau
      const mid = a0 + step / 2;
      ctx.save();
      ctx.translate(Math.cos(mid) * NUM_R, Math.sin(mid) * NUM_R);
      ctx.rotate(mid + Math.PI / 2);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (p.win) { ctx.font = "15px Arial"; ctx.fillText("🎁", 0, 0); }
      else {
        ctx.fillStyle = "#f6efe0";
        ctx.font = "bold 12px Georgia, 'Times New Roman', serif";
        ctx.fillText(String(p.num), 0, 0);
      }
      ctx.restore();
    }
    // séparateurs (frettes laiton) + studs
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 - step / 2 + i * step;
      const c0 = Math.cos(a), s0 = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(c0 * P_IN, s0 * P_IN);
      ctx.lineTo(c0 * P_OUT, s0 * P_OUT);
      ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(208,166,84,.85)"; ctx.stroke();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,245,210,.7)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(c0 * P_OUT, s0 * P_OUT, 2.4, 0, 7);
      ctx.fillStyle = "#f3da8c"; ctx.fill();
      ctx.lineWidth = .6; ctx.strokeStyle = "rgba(90,60,15,.8)"; ctx.stroke();
    }
    drawTurret(ctx);
  }

  function drawTurret(ctx) {
    // disque laiton central
    const td = ctx.createRadialGradient(-R * 0.08, -R * 0.10, R * 0.02, 0, 0, P_IN);
    td.addColorStop(0, "#f6e0a4"); td.addColorStop(.42, "#cda44f"); td.addColorStop(.78, "#8a6526"); td.addColorStop(1, "#4f3713");
    ctx.beginPath(); ctx.arc(0, 0, P_IN, 0, 7); ctx.fillStyle = td; ctx.fill();
    // gorges usinées
    [P_IN * 0.82, P_IN * 0.6, P_IN * 0.4].forEach((rr) => {
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, rr - 1.4, 0, 7); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,244,205,.30)"; ctx.stroke();
    });
    // poignée en croix (spindle)
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate((k * Math.PI) / 2);
      ctx.beginPath();
      ctx.moveTo(-R * 0.032, -R * 0.05);
      ctx.lineTo(-R * 0.016, -R * 0.40);
      ctx.quadraticCurveTo(0, -R * 0.435, R * 0.016, -R * 0.40);
      ctx.lineTo(R * 0.032, -R * 0.05);
      ctx.closePath();
      const ag = ctx.createLinearGradient(-R * 0.03, 0, R * 0.03, 0);
      ag.addColorStop(0, "#6a4c1b"); ag.addColorStop(.5, "#f3da8c"); ag.addColorStop(1, "#6a4c1b");
      ctx.fillStyle = ag; ctx.fill();
      ctx.lineWidth = .6; ctx.strokeStyle = "rgba(60,40,10,.6)"; ctx.stroke();
      ctx.restore();
    }
    // pommeau central
    const cap = ctx.createRadialGradient(-3, -3, 1, 0, 0, R * 0.085);
    cap.addColorStop(0, "#fff6d8"); cap.addColorStop(.55, "#e6c061"); cap.addColorStop(1, "#7d5a1e");
    ctx.beginPath(); ctx.arc(0, 0, R * 0.085, 0, 7); ctx.fillStyle = cap; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.03, 0, 7); ctx.fillStyle = "#4a3411"; ctx.fill();
  }

  /* reflet vitré global (ne tourne pas) */
  function drawGloss(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.clip();
    const gl = ctx.createLinearGradient(0, CY - R, 0, CY + R * 0.2);
    gl.addColorStop(0, "rgba(255,255,255,.12)"); gl.addColorStop(.5, "rgba(255,255,255,.03)"); gl.addColorStop(1, "transparent");
    ctx.fillStyle = gl; ctx.fillRect(0, 0, S, S);
    // vignette
    const vg = ctx.createRadialGradient(CX, CY, R * 0.5, CX, CY, R);
    vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(0,0,0,.4)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);
    ctx.restore();
  }

  function drawBall(ctx) {
    const rad = (ballDeg.current * Math.PI) / 180;
    const bx = CX + ballRad.current * Math.cos(rad);
    const by = CY + ballRad.current * Math.sin(rad);
    ctx.beginPath(); ctx.arc(bx + 1, by + 2, BALL, 0, 7);
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fill();
    const bg = ctx.createRadialGradient(bx - 2, by - 2.2, .5, bx, by, BALL + 1);
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(.4, "#eaeaee"); bg.addColorStop(1, "#8c8c95");
    ctx.beginPath(); ctx.arc(bx, by, BALL, 0, 7); ctx.fillStyle = bg; ctx.fill();
    // petit éclat
    ctx.beginPath(); ctx.arc(bx - 1.8, by - 1.8, 1.4, 0, 7); ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fill();
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

  const eduNote = (
    <div className="edu">
      <p style={{ margin: 0 }}>
        <b>En passant…</b> ce que tu viens de jouer — le quiz, la roue, le résultat — <b>c'est un logiciel.</b> Le même
        genre de système peut transformer <b>n'importe quelle offre</b> en jeu auquel tes prospects veulent jouer.
      </p>
    </div>
  );

  return (
    <div className="wrap">
      <div className="card">
        <div className="fade" key={screen + qIndex}>

          {/* INTRO */}
          {screen === "intro" && (
            <section>
              <span className="eyebrow">{CONFIG.marque} · La Roue</span>
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
              {eduNote}
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
              {eduNote}
            </section>
          )}

          {/* LOSE */}
          {screen === "lose" && (
            <section>
              <div className="result-emoji">🙃</div>
              <h2 className="center">Pas le prix cette fois… mais lis ça 👇</h2>
              {eduNote}
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
