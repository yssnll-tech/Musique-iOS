# Musique — app iOS (IPA)

Lecteur de musique personnel pour iPhone : importez vos fichiers audio locaux
(MP3, M4A, FLAC, WAV, AAC, OGG…) et écoutez-les dans une interface soignée façon
app **Musique**, avec un design **Liquid Glass** (surfaces en verre translucide).

L'app est **100 % autonome et hors-ligne** : aucune connexion, aucun compte, aucun
serveur. Toute votre bibliothèque (morceaux, pochettes, playlists) est stockée
**localement sur l'appareil** (IndexedDB, dans le conteneur privé de l'app).

Ce dépôt produit une **IPA non signée** via GitHub Actions, que vous installez
ensuite sur votre iPhone avec un outil de sideload (AltStore, Sideloadly).

---

## 1. Construire l'IPA avec GitHub (recommandé)

Aucun Mac requis de votre côté : GitHub fournit le runner macOS.

1. Créez un dépôt GitHub et poussez-y ce dossier :
   ```bash
   cd Musique-iOS
   git init
   git add .
   git commit -m "Musique iOS"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/Musique-iOS.git
   git push -u origin main
   ```
2. Le workflow **« Build iOS (IPA non signée) »** se lance automatiquement au push.
   Vous pouvez aussi le déclencher à la main : onglet **Actions** → *Build iOS* →
   **Run workflow**.
3. À la fin (~3–5 min), ouvrez le run terminé → section **Artifacts** →
   téléchargez **`Musique-unsigned-ipa`**. Il contient `Musique-unsigned.ipa`.

Ce que fait le workflow (`.github/workflows/ios.yml`) :
`npm ci` + `npm run build` (app web) → copie du build dans la coquille iOS →
`xcodegen generate` → `xcodebuild archive` **sans signature** → empaquetage
`Payload/Musique.app` en `.ipa`.

---

## 2. Installer l'IPA sur l'iPhone (sideload)

L'IPA est **non signée** : elle ne s'installe pas telle quelle. Un outil de
sideload la **re-signe avec votre propre identifiant Apple** au moment de
l'installation. Deux options courantes et gratuites :

### Option A — Sideloadly (le plus simple)
1. Installez **Sideloadly** (Mac ou Windows) : <https://sideloadly.io>.
2. Branchez l'iPhone en USB, ouvrez Sideloadly.
3. Glissez `Musique-unsigned.ipa`, entrez votre identifiant Apple, cliquez **Start**.
4. Sur l'iPhone : **Réglages → Général → VPN et gestion de l'appareil** → faites
   confiance à votre profil de développeur.

### Option B — AltStore
1. Installez **AltServer** (Mac/PC) et **AltStore** sur l'iPhone : <https://altstore.io>.
2. Dans AltStore → **My Apps → +** → sélectionnez `Musique-unsigned.ipa`.

### À savoir (comptes Apple gratuits)
- Une app signée avec un **identifiant Apple gratuit expire au bout de 7 jours** :
  il faut la « rafraîchir » (rouvrir Sideloadly / AltStore) avant expiration.
- Un compte gratuit est limité à **3 apps sideloadées** simultanément.
- Un compte **Apple Developer payant** (99 $/an) porte la validité à 1 an.

---

## 3. Mettre de la musique dans l'app

Dans l'app, touchez **« Importer de la musique »** (barre latérale / menu ☰) puis
choisissez vos fichiers audio depuis l'app **Fichiers** (iCloud Drive, « Sur mon
iPhone », etc.). Les morceaux sont copiés dans le stockage local de l'app ; les
métadonnées (titre, artiste, album, pochette) sont lues automatiquement.

> Astuce : pour transférer des fichiers audio sur l'iPhone, utilisez iCloud Drive,
> AirDrop, ou l'app Fichiers ; ils apparaîtront dans le sélecteur d'import.

---

## 4. Développement local (optionnel, nécessite un Mac)

Prérequis : Node 20+, Xcode 15+, et [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`).

```bash
# 1. App web en mode dev (dans le navigateur)
cd web
npm install
npm run dev            # http://localhost:5173

# 2. Build web + coquille iOS dans Xcode
npm run build
cd ..
rm -rf ios/Resources/web && mkdir -p ios/Resources/web
cp -R web/dist/. ios/Resources/web/
xcodegen generate      # crée Musique.xcodeproj
open Musique.xcodeproj  # Cmd+R pour lancer sur simulateur / appareil
```

---

## 5. Structure du projet

```
Musique-iOS/
├── web/                     # App web (React 19 + TypeScript + Tailwind 4 + Vite)
│   ├── src/                 #   code source (UI, lecteur, stockage local)
│   │   ├── lib/store.ts     #   couche de stockage local (IndexedDB) — 0 backend
│   │   ├── context/         #   bibliothèque + lecteur audio
│   │   ├── components/      #   UI (Liquid Glass, adaptée iPhone)
│   │   └── pages/           #   écrans (Morceaux, Albums, Artistes, Playlists…)
│   ├── index.html
│   ├── vite.config.ts       #   base relative (pour le schéma app://)
│   └── package.json
├── ios/                     # Coquille iOS (SwiftUI)
│   ├── Sources/
│   │   ├── MusiqueApp.swift  #   point d'entrée
│   │   ├── ContentView.swift
│   │   └── WebView.swift     #   WKWebView + handler du schéma app:// (sert web/)
│   ├── Resources/
│   │   ├── Info.plist
│   │   └── web/              #   ← reçoit le build web (rempli par la CI)
│   └── Assets.xcassets/
│       ├── AppIcon.appiconset/   #   icône musique 1024×1024
│       └── LaunchBackground.colorset/
├── project.yml              # définition du projet (XcodeGen)
└── .github/workflows/ios.yml # CI : build web + IPA non signée
```

## Notes techniques
- **Autonomie** : la couche réseau/DB d'origine (runtime Moxt) a été remplacée par
  un stockage **IndexedDB** local (`web/src/lib/store.ts`). Les fichiers audio et
  pochettes sont conservés en `Blob` et lus via `URL.createObjectURL`.
- **Origine sécurisée** : la coquille sert le site via un **schéma personnalisé
  `app://`** (et non `file://`), ce qui garantit une origine stable et le bon
  fonctionnement persistant d'IndexedDB et de la lecture audio dans la WKWebView.
- **Routage** : `HashRouter` (routes en `#/…`) pour un fonctionnement fiable depuis
  une origine locale.
- **Identifiant du bundle** : `com.musique.app` (modifiable dans `project.yml`).
