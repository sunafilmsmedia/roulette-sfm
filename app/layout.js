import "./globals.css";

export const metadata = {
  title: "La Roue — Gagne ton logiciel AI",
  description:
    "Réponds à 3 questions, tourne la roue. 30% de chance de gagner un logiciel AI qui remplit ton agenda de clients.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr-CA">
      <body>{children}</body>
    </html>
  );
}
