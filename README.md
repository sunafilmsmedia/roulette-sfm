# 🎰 Roulette ICP — Logiciel qui qualifie

Une roue gamifiée à **~30% de gagnants** où le « hasard » est en réalité **piloté par ton ICP**.
Tout le monde joue → les leads (gagnants **et** perdants intéressés) rentrent dans ton CRM.

> Concept : montrer qu'avec un logiciel comme ça, on peut transformer **n'importe quelle offre** en jeu.

---

## 🧠 Comment un gagnant est choisi

Le joueur répond à 3 questions : **métier → expérience → objectif mensuel**.
S'il correspond à l'ICP (par défaut **Sylvain, courtier établi qui veut scaler**), la roue **tombe sur un prix**.
Sinon il joue quand même, ne gagne pas, mais reçoit l'offre éducative à la fin.

**Règle « gagnant » par défaut** (modifiable dans `CONFIG.icp`) :

| Critère | Valeurs gagnantes |
|---|---|
| Métier | courtier hypothécaire · immobilier · assurance |
| Expérience | 3–8 ans · 8 ans + |
| Objectif | « plus de clients » · « scaler / équipe » |

→ Les 3 doivent matcher pour gagner. Ajuste les listes pour viser exactement ~30% selon ton trafic.

---

## ⚙️ Configuration (tout est en haut du `index.html`, objet `CONFIG`)

À refaire **à chaque déploiement** (les intégrations sont per-projet) :

```js
const CONFIG = {
  marque:      "Ton Offre",
  prixHTML:    "...",                 // le texte du prix montré au gagnant
  webhookUrl:  "",                    // ⬅️ TON webhook Make/Zapier/n8n/GoHighLevel
  metaPixelId: "",                    // optionnel
  clarityId:   "",                    // optionnel
  icp: { metiers:[...], experiences:[...], objectifs:[...] }  // qui gagne
};
```

### Webhook / CRM
Chaque lead est envoyé en `POST JSON` à `webhookUrl`. Payload :

```json
{
  "prenom":"", "nom":"", "email":"", "telephone":"",
  "metier":"courtier_hypothecaire", "experience":"8_plus", "objectif":"scaler",
  "resultat":"gagnant",            // ou "perdant_interesse"
  "icp_match":true,
  "prix":"Logiciel AI gratuit + 50% rabais",
  "source":"roulette", "marque":"Ton Offre", "page":"https://..."
}
```

> Sans webhook configuré, les leads sont stockés dans `localStorage` (`roulette_leads`) + loggés en console — rien n'est perdu pendant les tests.

### Tracking
Renseigne `metaPixelId` et/ou `clarityId` → les scripts s'injectent seuls.
Événements envoyés : `Spin`, `Win`, `Lose`, `Lead` (Pixel `Lead` standard à la soumission).

---

## ✏️ Personnaliser

- **Questions / réponses** → tableau `QUESTIONS`
- **Segments de la roue** → tableau `SEGMENTS` (`win:true` = prix). 3 gagnants sur 8 par défaut.
- **Textes / couleurs** → sections HTML + variables CSS `:root`

---

## 🚀 Déployer

C'est **un seul fichier**. Au choix :
- Glisse `index.html` sur **Netlify Drop** (netlify.com/drop)
- `vercel` / GitHub Pages / n'importe quel hébergeur statique
- Ouvre-le localement pour tester : double-clic sur `index.html`

---

## 🔁 Réutiliser pour une autre offre

1. Copie le dossier
2. Change `CONFIG` (marque, prix, webhook, ICP)
3. Adapte `QUESTIONS` au nouveau public
4. Re-déploie

C'est exactement le point du jeu : **une offre = un logiciel comme celui-ci.**
