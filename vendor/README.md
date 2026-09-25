# vendor/

Bibliothèques tierces utilisées par le site. Elles sont stockées localement pour que
le projet fonctionne **hors ligne**, sans npm, sans CDN et sans étape de compilation.

## Contenu

| Bibliothèque | Version | Licence | Fichiers conservés |
| --- | --- | --- | --- |
| Bootstrap | 5.2.2 | MIT | `bootstrap-reboot.min.css`, `bootstrap-grid.min.css` |
| Bootstrap Icons | 1.11.3 | MIT | `bootstrap-icons.min.css` + la police `bootstrap-icons.woff2` |

## Versions exclues volontairement

Seuls les fichiers réellement chargés par les pages HTML sont conservés. Bootstrap
était livré ici en paquet complet (4 400 fichiers, 22 Mo) alors que le site
n'utilise que la grille et le reboot en CSS. Ont été retirés :

- les sources SCSS, les tests, la doc et le site de démonstration Bootstrap
- le JavaScript de Bootstrap (non utilisé, tout le comportement est dans `assets/js/main.js`)
- les autres feuilles CSS minifiées (`.map` incluses)
- les ~2 000 SVG individuels de Bootstrap Icons (les icônes passent par la police)
- la police `bootstrap-icons.woff`, doublon de `bootstrap-icons.woff2` réservé aux
  navigateurs d'avant 2018. La ligne `src:` du `@font-face` a été réduite au `woff2`
- les sources, manifestes et fichiers de configuration des deux paquets npm

Résultat : **7 fichiers, 275 Ko** au lieu de 4 433 fichiers, 22 Mo.

## Régles de maintenance

- **Ne pas modifier le contenu de ces fichiers** : ils sont tiers, à deux exceptions près
  documentées ci-dessous.
- Bootstrap : les lignes `sourceMappingURL` ont été retirées, les fichiers `.map` n'étant
  plus présents.
- Bootstrap Icons : la ligne `src:` du `@font-face` ne déclare plus que le format `woff2`.
  Si un jour une police `.woff` est réinstallée, remettre les deux `url()` d'origine.
- **Ne pas supprimer ce dossier** : le site perdrait sa mise en page et toutes ses icônes.
- Le site ne charge que 3 fichiers de ce dossier, déclarés dans le `<head>` de chaque page :
  ```html
  <link rel="stylesheet" href="./vendor/bootstrap-5.2.2/dist/css/bootstrap-reboot.min.css">
  <link rel="stylesheet" href="./vendor/bootstrap-5.2.2/dist/css/bootstrap-grid.min.css">
  <link rel="stylesheet" href="./vendor/bootstrap-icons-1.11.3/font/bootstrap-icons.min.css">
  ```

## Changer de version de Bootstrap Icons

La version installée dans le dépôt est décisive : une icône absente de la version
locale s'affiche comme une case vide, sans erreur dans la console. C'est ce qui est
arrivé avec `bi-twitter-x` en 1.9.1, d'où le passage en 1.11.3.

Pour changer de version :

1. télécharger `font/bootstrap-icons.min.css` et `font/fonts/bootstrap-icons.woff2`
   depuis <https://cdn.jsdelivr.net/npm/bootstrap-icons@VERSION/font/>, ainsi que
   `LICENSE.md` depuis <https://github.com/twbs/icons/blob/main/LICENSE> ;
2. nommer le dossier `vendor/bootstrap-icons-VERSION` ;
3. mettre à jour la balise `<link>` dans les 15 fichiers HTML de la racine ;
4. vérifier qu'aucune icône utilisée n'a disparu : c'est le seul vrai risque.

## Icône `bi-shorts`

`bi-shorts` a été remplacé par `bi-person-standing` dans `assets/js/products.js`.
Le nom `bi-shorts` n'a jamais existé dans Bootstrap Icons, dans aucune version
publiée : il produisait une case vide sur la catégorie « Shorts ».

## Réinstaller depuis la source

- Bootstrap 5.2.2 — <https://github.com/twbs/bootstrap/releases/tag/v5.2.2>
- Bootstrap Icons 1.11.3 — <https://github.com/twbs/icons/releases/tag/v1.11.3>
