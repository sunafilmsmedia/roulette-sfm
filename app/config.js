/* ===================================================================
   CONFIG — À PERSONNALISER À CHAQUE DÉPLOIEMENT
   (les intégrations sont per-projet : webhook, pixel, Clarity)
   =================================================================== */
export const CONFIG = {
  marque: "Ton Offre",

  // 🎁 Le prix (HTML) affiché au gagnant. Mets ton vrai prix ici.
  prixHTML:
    "Tu gagnes <b>l'accès GRATUIT au logiciel AI</b> qui qualifie tes prospects à ta place " +
    "<b>+ 50% de rabais à vie</b> sur la version complète.<br>" +
    "<span class='small'>(Valeur réelle&nbsp;: 1&nbsp;500&nbsp;$/mois)</span>",

  // 🔗 Où partent les leads (gagnants ET perdants intéressés).
  //    Colle ton URL Make / Zapier / n8n / GoHighLevel ici.
  //    ⚠️ Laisse vide pour tester sans rien envoyer (capture locale seulement).
  webhookUrl: "",

  // 📊 Tracking (laisse vide si non utilisé)
  metaPixelId: "",
  clarityId: "",

  // 🎯 RÈGLES ICP — qui GAGNE (Sylvain : courtier établi qui veut scaler)
  icp: {
    metiers: ["courtier_hypothecaire", "courtier_immobilier", "courtier_assurance"],
    experiences: ["3_8", "8_plus"],
    objectifs: ["croitre", "scaler"],
  },
};

/* ===================================================================
   QUESTIONS DU QUIZ
   =================================================================== */
export const QUESTIONS = [
  {
    key: "metier",
    label: "Question 1 / 3 — Ton métier",
    titre: "Qu'est-ce que tu fais comme métier ?",
    options: [
      { ico: "🏠", txt: "Courtier hypothécaire", val: "courtier_hypothecaire" },
      { ico: "🔑", txt: "Courtier immobilier", val: "courtier_immobilier" },
      { ico: "🛡️", txt: "Conseiller / courtier en assurance", val: "courtier_assurance" },
      { ico: "💼", txt: "Vente / représentant", val: "vendeur" },
      { ico: "✨", txt: "Entrepreneur / autre", val: "autre" },
    ],
  },
  {
    key: "experience",
    label: "Question 2 / 3 — Ton expérience",
    titre: "Depuis combien de temps fais-tu ça ?",
    options: [
      { ico: "🌱", txt: "Moins de 1 an", val: "moins_1" },
      { ico: "📈", txt: "1 à 3 ans", val: "1_3" },
      { ico: "🔥", txt: "3 à 8 ans", val: "3_8" },
      { ico: "🏆", txt: "Plus de 8 ans", val: "8_plus" },
    ],
  },
  {
    key: "objectif",
    label: "Question 3 / 3 — Ton objectif",
    titre: "Ton objectif pour les 12 prochains mois ?",
    options: [
      { ico: "⚖️", txt: "Juste stabiliser mes revenus", val: "stabiliser" },
      { ico: "🎯", txt: "Attirer plus de clients, plus régulièrement", val: "croitre" },
      { ico: "🚀", txt: "Scaler et bâtir une équipe", val: "scaler" },
      { ico: "👀", txt: "Je regarde juste par curiosité", val: "curieux" },
    ],
  },
];

/* ===================================================================
   ROUE — 8 segments (3 gagnants)
   =================================================================== */
export const SEGMENTS = [
  { label: "LOGICIEL GRATUIT", win: true },
  { label: "Presque…", win: false },
  { label: "50% RABAIS", win: true },
  { label: "Rejoue", win: false },
  { label: "ACCÈS VIP", win: true },
  { label: "Pas cette fois", win: false },
  { label: "Dommage", win: false },
  { label: "Oups !", win: false },
];
