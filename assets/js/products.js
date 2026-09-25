/* ==========================================================================
   DK SPIRIT — Catalogue produits (source de données unique)
   --------------------------------------------------------------------------
   Tout le site lit ses produits depuis ce fichier. Aucune page ne doit plus
   écrire un nom de produit ou un prix en dur : c'est exactement ce qui avait
   produit des cartes "t-shirt-dk" sur les casques et des badges "-45%" faux.

   Chargé en script classique (pas de module) pour rester compatible avec une
   ouverture directe du fichier via file://
   ========================================================================== */
(function (global) {
	"use strict";

	/* --- Catégories ------------------------------------------------------ */
	var CATEGORIES = [
		{
			id: "tshirts",
			name: "T-Shirts",
			tagline: "Collez-vous à la série",
			icon: "bi-bag-heart",
			page: "hommes.html"
		},
		{
			id: "shorts",
			name: "Shorts",
			tagline: "L'été, tout l'été",
			icon: "bi-shorts",
			page: "hommes.html"
		},
		{
			id: "pulls",
			name: "Pulls & Sweats",
			tagline: "Pour les nuits de Dakar",
			icon: "bi-layers",
			page: "pull_jogger.html"
		},
		{
			id: "joggers",
			name: "Joggers",
			tagline: "Confort premium",
			icon: "bi-arrow-down-up",
			page: "pull_jogger.html"
		},
		{
			id: "casques",
			name: "Casques",
			tagline: "L'isolation, au bon prix",
			icon: "bi-headphones",
			page: "casque.html"
		},
		{
			id: "studio",
			name: "Studio & Audio",
			tagline: "La signature BuzzLab",
			icon: "bi-sliders",
			page: "studio.html"
		}
	];

	/* --- Tailles proposées par famille ---------------------------------- */
	var SIZES = {
		apparel: ["S", "M", "L", "XL", "XXL"],
		audio: []
	};

	/* --- Produits --------------------------------------------------------
	   price     : prix de vente en FCFA (entier)
	   oldPrice  : prix barré, ou null s'il n'y a pas de promotion
	   Le badge de remise est CALCULÉ à partir de ces deux valeurs, il n'est
	   jamais écrit en dur (c'était la source des "-45%" mensongers).
	   ---------------------------------------------------------------------- */
	var PRODUCTS = [
		/* ---------------- T-SHIRTS ---------------- */
		{
			id: "t1", cat: "tshirts", img: "assets/images/products/tshirts/t1.png",
			name: "T-shirt « 4 Buzz »",
			subtitle: "Édition For The Buzz — coton jaune",
			price: 5500, oldPrice: 10000,
			featured: true,
			desc: "Le t-shirt le plus iconique de la maison. Imprimé « 4BUZZ » en \
				grand format sur coton jaune, sorti pour la sortie de l'album For \
				The Buzz du label BuzzLab. Coupe régulière, col côtelé, étiquette \
				brodée dk. spirit dans le dos."
		},
		{
			id: "t2", cat: "tshirts", img: "assets/images/products/tshirts/t2.png",
			name: "T-shirt DK Spirit Logo",
			subtitle: "Coton bio — logo poitrine",
			price: 5500, oldPrice: 10000,
			desc: "Le t-shirt/logo de la collection permanente. Logo dk. spirit \
				brodé sur la poitrine gauche, 100 % coton bio peigné 180 g/m². \
				Coupe unisexe, lavable à 30 °C."
		},
		{
			id: "t3", cat: "tshirts", img: "assets/images/products/tshirts/t3.png",
			name: "T-shirt DK Spirit Essential",
			subtitle: "Le basique du quotidien",
			price: 5500, oldPrice: 10000,
			desc: "Coton épais, coupe droite, rien de superflu. Le modèle que vous \
				porterez le plus souvent, disponible en cinq tailles."
		},
		{
			id: "t4", cat: "tshirts", img: "assets/images/products/tshirts/t4.png",
			name: "T-shirt DK Spirit Street",
			subtitle: "Grand dos imprimé",
			price: 5500, oldPrice: 10000,
			desc: "Imprimé grand format dans le dos, coupe oversize. Pensé pour \
				être superposé et porté avec un jogger."
		},
		{
			id: "t5", cat: "tshirts", img: "assets/images/products/tshirts/t5.png",
			name: "T-shirt DK Spirit Oversize",
			subtitle: "Volume et-dropped shoulder",
			price: 5500, oldPrice: 10000,
			desc: "Épaules tombantes, corps ample, longueur courte. Le cut \
				oversize de la maison."
		},
		{
			id: "t6", cat: "tshirts", img: "assets/images/products/tshirts/t6.png",
			name: "T-shirt DK Spirit Noir",
			subtitle: "Noir intégral — logo ton sur ton",
			price: 5500, oldPrice: 10000,
			desc: "La version noire, logo ton sur ton. Indispensable, se porte \
				par-dessus tout."
		},
		{
			id: "t7", cat: "tshirts", img: "assets/images/products/tshirts/t7.png",
			name: "T-shirt DK Spirit Premium",
			subtitle: "Coton peigné 220 g/m²",
			price: 15000, oldPrice: 20000,
			desc: "Gamme supérieure : coton peigné 220 g/m², finitions \
				renforcées, impression raster de haute densité. Coupe premium."
		},
		{
			id: "t8", cat: "tshirts", img: "assets/images/products/tshirts/t8.png",
			name: "T-shirt DK Spirit Collector",
			subtitle: "Édition limitée numérotée",
			price: 15000, oldPrice: 20000,
			desc: "Série limitée numérotée à l'intérieur du col. Chaque pièce \
				est unique et n'est pas rééditée."
		},
		{
			id: "p7", cat: "tshirts", img: "assets/images/products/tshirts/p7.png",
			name: "T-shirt DK Spirit Vintage",
			subtitle: "Teinture effet délavé",
			price: 15000, oldPrice: 20000,
			desc: "Teinte légèrement délavée et bords adoucis pour un rendu \
				vintage. Coton souple et respirant."
		},
		{
			id: "p8", cat: "tshirts", img: "assets/images/products/tshirts/p8.png",
			name: "T-shirt DK Spirit Tour",
			subtitle: "Imprimé officiel de tournée",
			price: 15000, oldPrice: 20000,
			desc: "L'imprimé de la tournée, dos entier. Réédition limitée \
				après le passage au Sénégal."
		},
		{
			id: "p9", cat: "tshirts", img: "assets/images/products/tshirts/p9.png",
			name: "T-shirt DK Spirit Studio",
			subtitle: "Collection BuzzLab",
			price: 5500, oldPrice: 10000,
			desc: "Issu de la collection conjointe DK Spirit × BuzzLab. \
				Imprimé_errors graphique lié à l'univers studio."
		},
		{
			id: "p10", cat: "tshirts", img: "assets/images/products/tshirts/p10.png",
			name: "T-shirt DK Spirit Limitée",
			subtitle: "Édition studio — 200 exemplaires",
			price: 15000, oldPrice: 20000,
			desc: "Tirage de 200 exemplaires signé au dos. Rentrez vite, le \
				tirage part toujours en premier."
		},

		/* ---------------- SHORTS ---------------- */
		{
			id: "s1", cat: "shorts", img: "assets/images/products/shorts/s1.png",
			name: "Short DK Spirit",
			subtitle: "Coton lourd — taille élastiquée",
			price: 5500, oldPrice: 10000,
			featured: true,
			desc: "Short en molleton de coton lourd, taille élastiquée et \
				cordon de serrage plat. Deux poches latérales, une arrière. \
				Coupe droite mi-longue."
		},
		{
			id: "s2", cat: "shorts", img: "assets/images/products/shorts/s2.png",
			name: "Short DK Spirit",
			subtitle: "Poches plaquées",
			price: 5500, oldPrice: 10000,
			desc: "Même coupe que le short Icone, avec des poches plaquées \
				et contrastantes. Molleton gratté intérieur."
		},
		{
			id: "s3", cat: "shorts", img: "assets/images/products/shorts/s3.png",
			name: "Short DK Spirit",
			subtitle: "Coupe sport",
			price: 5500, oldPrice: 10000,
			desc: "Coupe plus sport, entrejambe plus haut. Tissu léger et \
				séchage rapide pour les journées chaudes."
		},
		{
			id: "s4", cat: "shorts", img: "assets/images/products/shorts/s4.png",
			name: "Short DK Spirit",
			subtitle: "Avec poches zippées",
			price: 5500, oldPrice: 10000,
			desc: "Doté de poches zippées pour ne rien perdre. Doublure \
				intérieure en mesh respirant."
		},
		{
			id: "s5", cat: "shorts", img: "assets/images/products/shorts/s5.png",
			name: "Short DK Spirit",
			subtitle: "Rayures ton sur ton",
			price: 5500, oldPrice: 10000,
			desc: "Rayures ton sur ton, cordons contrastés. Un classique \
				qui sort de l'ordinaire."
		},
		{
			id: "s6", cat: "shorts", img: "assets/images/products/shorts/s6.png",
			name: "Short DK Spirit",
			subtitle: "Poche cargo latérale",
			price: 5500, oldPrice: 10000,
			desc: "Poche cargo latérale plaquée, doublure renforcée. \
				Robuste et confortable."

		},

		/* ---------------- PULLS ---------------- */
		{
			id: "p1", cat: "pulls", img: "assets/images/products/pulls/p1.png",
			name: "Pull-over DK Spirit",
			subtitle: "Molleton gratté — capuche",
			price: 20000, oldPrice: 25000,
			featured: true,
			desc: "Le pull-over le plus vendu de la maison. Molleton de coton \
				gratté 380 g/m², capuche doublée, poche ventrale et cuffs \
				ribotés. Coupe oversize."
		},
		{
			id: "p2", cat: "pulls", img: "assets/images/products/pulls/p2.png",
			name: "Pull-over DK Spirit",
			subtitle: "Logo poitrine",
			price: 20000, oldPrice: 25000,
			desc: "Molleton gratté, logo dk. spirit brodé à gauche. Le coupé \
				confort pour les soirées fresh."
		},
		{
			id: "p3", cat: "pulls", img: "assets/images/products/pulls/p3.png",
			name: "Pull-over DK Spirit",
			subtitle: "Imprimé dos",
			price: 20000, oldPrice: 25000,
			desc: "Grand imprimé dans le dos, même molleton que le modèle \
				Icone. Pensé pour être porté en solo."
		},
		{
			id: "p4", cat: "pulls", img: "assets/images/products/pulls/p4.png",
			name: "Pull-over DK Spirit",
			subtitle: "Col montant zippé",
			price: 20000, oldPrice: 25000,
			desc: "Col montant avec fermeture éclair inversée. Coupe plus \
				ajustée, ideal par-dessus un t-shirt."
		},
		{
			id: "p5", cat: "pulls", img: "assets/images/products/pulls/p5.png",
			name: "Pull-over DK Spirit",
			subtitle: "Sans capuche",
			price: 20000, oldPrice: 25000,
			desc: "Version crew sans capuche, bord côtelé au poignet. \
				Très facile à porter en superposition."
		},
		{
			id: "p6", cat: "pulls", img: "assets/images/products/pulls/p6.png",
			name: "Pull-over DK Spirit",
			subtitle: "Edition BuzzLab",
			price: 20000, oldPrice: 25000,
			desc: "Édition conjointe avec le label BuzzLab, sérigraphie \
				exclusive au dos."
		},

		/* ---------------- JOGGERS ---------------- */
		{
			id: "j1", cat: "joggers", img: "assets/images/products/joggers/j1.png",
			name: "Jogger DK Spirit Noir",
			subtitle: "Molleton côtelé — taille élastiquée",
			price: 10000, oldPrice: 15000,
			featured: true,
			desc: "Le jogger signature, tout noir. Molleton côtelé à l'intérieur, \
				taille élastiquée avec cordon, chevilles resserrées et logo \
				dk. spirit brodé sur la cuisse."
		},
		{
			id: "j2", cat: "joggers", img: "assets/images/products/joggers/j2.png",
			name: "Jogger DK Spirit",
			subtitle: "Poche latérale zippée",
			price: 10000, oldPrice: 15000,
			desc: "Coupé dans un molleton lourd. Poches latérales zippées \
				et une poche arrière pour le téléphone."
		},
		{
			id: "j3", cat: "joggers", img: "assets/images/products/joggers/j3.png",
			name: "Jogger DK Spirit",
			subtitle: "Coupe tapered",
			price: 10000, oldPrice: 15000,
			desc: "Silhouette tapered, la jambe se resserre progressivement. \
				Se porte aussi bien avec un t-shirt qu'avec un pull."
		},
		{
			id: "j4", cat: "joggers", img: "assets/images/products/joggers/j4.png",
			name: "Jogger DK Spirit",
			subtitle: "Taille haute",
			price: 10000, oldPrice: 15000,
			desc: "Taille haute montée, très confortable assis. Deux \
				cordons de serrage."
		},
		{
			id: "j5", cat: "joggers", img: "assets/images/products/joggers/j5.png",
			name: "Jogger DK Spirit",
			subtitle: "Bord contrasté",
			price: 10000, oldPrice: 15000,
			desc: "Bords et cordons contrastés. Molleton gratté, coupe \
				confortable."
		},
		{
			id: "j6", cat: "joggers", img: "assets/images/products/joggers/j6.png",
			name: "Jogger DK Spirit",
			subtitle: "Edition limitée",
			price: 10000, oldPrice: 15000,
			desc: "Édition limitée, sérigraphie exclusive sur la cuisse. \
				Non rééditée."
		},

		/* ---------------- CASQUES ---------------- */
		{
			id: "c1", cat: "casques", img: "assets/images/products/casques/casque-dj-styler.jpeg",
			name: "Casque DJ Styler",
			subtitle: "Casque de DJ — évolutive",
			price: 45000, oldPrice: null,
			featured: true,
			desc: "Casque de DJ classique avec arceau en fonte et coussin de \
				remplacement. Les coussinets s'enlèvent et se remplacent, \
				ce qui allonge franchement sa durée de vie."
		},
		{
			id: "c2", cat: "casques", img: "assets/images/products/casques/casque-studio-ferme.jpeg",
			name: "Casque Studio Fermé",
			subtitle: "Monitoring — isolation 32 dB",
			price: 60000, oldPrice: null,
			desc: "Casque de monitoring fermé avec isolation phonique de \
				32 dB. Coussinets en mousse à mémoire de forme, câble \
				détachable, adaptateur 6,35 mm inclus."
		},
		{
			id: "c3", cat: "casques", img: "assets/images/products/casques/casque-studio-rgb.jpeg",
			name: "Casque Studio RGB",
			subtitle: "Éclairage surround",
			price: 55000, oldPrice: null,
			desc: "Casque de session avec rétroéclairage RGB sur les \
				oreillers. Wireless ou filaire, 30 h d'autonomie."
		},
		{
			id: "c4", cat: "casques", img: "assets/images/products/casques/casque-mixage-reference.jpeg",
			name: "Casque Mixage Référence",
			subtitle: "Réponse 5 Hz – 35 kHz",
			price: 75000, oldPrice: null,
			desc: "Casque de mixage neutre, réponse en fréquence très \
				large et distorsion faible. Le choix de l'ingénieur du son."
		},
		{
			id: "c5", cat: "casques", img: "assets/images/products/casques/casque-studio-leger.jpeg",
			name: "Casque Studio Léger",
			subtitle: "240 g — confort prolongé",
			price: 35000, oldPrice: null,
			desc: "Only 240 g sur la tête. Pensé pour les longues sessions \
				d'enregistrement, arceau souple et pliable."
		},
		{
			id: "c6", cat: "casques", img: "assets/images/products/casques/casque-monitoring-pro.jpeg",
			name: "Casque Monitoring Pro",
			subtitle: "Câble spirulé 3 m",
			price: 40000, oldPrice: null,
			desc: "Câble spirulé de 3 m qui ne s'emmêle pas, fiche jack \
				6,35 mm et adaptateur mini-jack fournis."
		},
		{
			id: "c7", cat: "casques", img: "assets/images/products/casques/casque-bluetooth.jpg",
			name: "Casque de Monitoring",
			subtitle: "Fermé — Bluetooth + filaire",
			price: 50000, oldPrice: null,
			desc: "Casque fermé qui se porte aussi bien au studio qu'à la \
				ville. Bluetooth 5.0, 40 h d'autonomie, repli filaire."
		},
		{
			id: "c8", cat: "casques", img: "assets/images/products/casques/casque-studio-80-ohm.jpeg",
			name: "Casque Studio 80 Ω",
			subtitle: "Référence 80 ohms",
			price: 65000, oldPrice: null,
			desc: "L'impédance de 80 Ω filtre le monitoring et garantit un \
				signal propre sur une table de mixage externe."
		},

		/* ---------------- STUDIO / BUZZLAB ---------------- */
		{
			id: "st1", cat: "studio", img: "assets/images/products/studio/micro-condensateur.jpeg",
			name: "Micro à condensateur",
			subtitle: "Studio — cardioïde, Livret fourni",
			price: 70000, oldPrice: null,
			featured: true,
			desc: "Micro à condensateur à large capsule, diagramme \
				cardioïde. Livré avec un pied anti-vibration et un filtre \
				anti-pop. Le micro de base pour \\\"\\\ home studio."
		},
		{
			id: "st2", cat: "studio", img: "assets/images/products/studio/clavier-midi-25.jpeg",
			name: "Clavier MIDI 25 touches",
			subtitle: "USB —.aftertouch",
			price: 250000, oldPrice: null,
			desc: "Clavier MIDI 25 touches avec 8 pads, 8 boutons rotatifs \
				et aftertouch. Plug & play sur Mac, Windows comme sur Linux, \
				compatible avec tous les DAW."
		},
		{
			id: "st3", cat: "studio", img: "assets/images/products/studio/paire-micro-stereo.jpeg",
			name: "Paire de micros à condensateur",
			subtitle: "Stéréo — pour la voix",
			price: 100000, oldPrice: null,
			desc: "Deux micros à condensateur appariés, montés en paire \
				stéréo. Idéal pour le chant, les podcast et la prise de \
				 voix front."
		},
		{
			id: "st4", cat: "studio", img: "assets/images/products/studio/station-enregistrement.jpeg",
			name: "Station d'enregistrement",
			subtitle: "Poste complet prêt à l'emploi",
			price: 175000, oldPrice: null,
			featured: true,
			desc: "Une station d'enregistrement complète : micro, \
				interface, casque et câbles. Vous branchez, vous \
				enregistrez. Aucun logiciel à installer."
		},
		{
			id: "st5", cat: "studio", img: "assets/images/products/studio/console-mixage.jpeg",
			name: "Console de mixage numérique",
			subtitle: "8 entrées / 2 sorties",
			price: 700000, oldPrice: null,
			desc: "Console de mixage numérique avec 8 préamplis, effets \
				intégrés, contrôleur et écran couleur. Le cœur d'un studio \
				de production."
		},
		{
			id: "st6", cat: "studio", img: "assets/images/products/studio/pad-controller.jpeg",
			name: "Pad Controller 16 pads",
			subtitle: "MIDI — 8 pads illuminés",
			price: 85000, oldPrice: null,
			desc: "Pad controller 16 pads RGB, pitch bend et molette. \
				Parfait pour la composition beat-making."
		},
		{
			id: "st7", cat: "studio", img: "assets/images/products/studio/enceintes-monitoring.webp",
			name: "Enceintes de monitoring (paire)",
			subtitle: "Biamplifiées — 6,5 pouces",
			price: 320000, oldPrice: null,
			desc: "Paire d'enceintes de monitoring biamplifiées avec \
				tweeter en soie et cône polypropylène. La référence pour \
				des mixes propres."
		},
		{
			id: "st8", cat: "studio", img: "assets/images/products/studio/studio-mobile-daw.webp",
			name: "Studio mobile DAW",
			subtitle: "Sac de transport incluse",
			price: 450000, oldPrice: null,
			desc: "Station de production mobile complète, sac de transport \
				inclus. Parfaite pour composer partout, même en studio de \
				répétition."
		}
	];

	/* --- Index d'accès rapide ------------------------------------------- */
	var BY_ID = {};
	PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });

	/* --- API publique ---------------------------------------------------- */
	global.DK = {
		currency: "FCFA",
		categories: CATEGORIES,
		products: PRODUCTS,
		SIZES: SIZES,

		/** Récupère un produit par son identifiant, ou undefined. */
		get: function (id) {
			return BY_ID[id] || null;
		},

		/** Récupère une catégorie par son identifiant, ou undefined. */
		category: function (id) {
			for (var i = 0; i < CATEGORIES.length; i++) {
				if (CATEGORIES[i].id === id) return CATEGORIES[i];
			}
			return null;
		},

		/** Produits d'une catégorie, dans l'ordre du catalogue. */
		byCategory: function (catId) {
			return PRODUCTS.filter(function (p) { return p.cat === catId; });
		},

		/** Produits mis en avant sur la page d'accueil. */
		featured: function () {
			return PRODUCTS.filter(function (p) { return p.featured; });
		},

		/** Produits d'une catégorie, mise en avant en premier. */
		featuredOf: function (catId) {
			return PRODUCTS.filter(function (p) {
				return p.cat === catId && p.featured;
			});
		},

		/**
		 * Pourcentage de remise, calculé — jamais stocké en dur.
		 * @returns {number} entier, 0 si le produit n'est pas en promotion
		 */
		discount: function (product) {
			if (!product || !product.oldPrice || product.oldPrice <= product.price) {
				return 0;
			}
			return Math.round((1 - product.price / product.oldPrice) * 100);
		},

		/** Tailles disponibles pour un produit. */
		sizesOf: function (product) {
			if (!product) return [];
			return SIZES[product.cat === "casques" || product.cat === "studio"
				? "audio"
				: "apparel"] || [];
		},

		/** Page de catégorie associée. */
		pageFor: function (catId) {
			var c = this.category(catId);
			return c ? c.page : "index.html";
		}
	};
})(window);
