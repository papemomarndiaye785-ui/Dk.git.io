# DK SPIRIT

Boutique e-commerce statique réalisée en HTML, CSS et JavaScript, sans étape de compilation.

## Lancer le site

- Ouvrir `index.html` directement dans un navigateur, ou
- lancer un serveur local depuis la racine du projet :

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>.

## Organisation du projet

```text
.
├── index.html                  Page d'accueil
├── hommes.html                 T-shirts et shorts
├── pull_jogger.html            Pulls et joggers
├── casque.html                 Casques
├── studio.html                 Matériel studio et audio
├── produit.html                Fiche produit dynamique
├── panier.html                 Panier
├── inscription.html            Création de compte
├── se connecter.html           Connexion
├── aide.html                   Aide et questions fréquentes
├── c1.html, j1.html, ...       Fiches produit historiques
├── assets/
│   ├── css/style.css           Styles de l'application
│   ├── js/products.js          Catalogue et données produits
│   ├── js/main.js              Logique du site
│   └── images/
│       ├── branding/           Logo, favicon et images sociales
│       └── products/
│           ├── tshirts/        Photos des t-shirts
│           ├── shorts/         Photos des shorts
│           ├── pulls/          Photos des pulls
│           ├── joggers/        Photos des joggers
│           ├── casques/        Photos des casques
│           └── studio/         Photos du matériel studio
├── vendor/                      Bibliothèques tierces (voir vendor/README.md)
│   ├── bootstrap-5.2.2/        Bootstrap 5.2.2 — reboot + grille uniquement
│   └── bootstrap-icons-1.11.3/ Bootstrap Icons 1.11.3 — CSS + police woff2
└── archive/
    └── legacy-images/          Images anciennes non utilisées
```

## Règles de maintenance

- Les prix, textes et chemins des photos actives se trouvent dans `assets/js/products.js`.
- Les chemins des feuilles de style, bibliothèques et images sont relatifs à la racine du site.
- Les bibliothèques dans `vendor/` sont tierces : ne pas les modifier directement. Seuls les
  fichiers réellement chargés par les pages y sont conservés (7 fichiers, 275 Ko).
- Les icônes de l'interface utilisent les classes `bi-*` de Bootstrap Icons. Vérifier dans
  `vendor/bootstrap-icons-1.11.3/font/bootstrap-icons.min.css` que l'icône voulue existe
  avant de l'utiliser dans une page ou dans `products.js`.
- Les images de `archive/legacy-images/` ne sont utilisées par aucune page. Elles ont été conservées pour ne rien supprimer.
