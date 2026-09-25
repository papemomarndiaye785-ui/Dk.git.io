/* ==========================================================================
   DK SPIRIT — Logique de l'application
   --------------------------------------------------------------------------
   Remplace l'ancien main.js (12 lignes qui ouvraient/fermaient un tiroir et
   dont la moitié plantait parce qu'il s'exécutait dans <head>, avant même que
   le DOM existe).

   Ce fichier est un script CLASSIQUE, pas un module ES : c'est obligatoire
   pour que le site fonctionne en ouvrant simplement le fichier via file://,
   ou les modules ES sont bloques par CORS.

   Organisation
     1. Utilitaires
     2. Magasin du panier (localStorage)
     3. Notifications (toasts)
     4. Panneaux (tiroir panier, navigation mobile, menu compte)
     5. Rendu des composants
     6. Recherche
     7. Fiche produit
     8. Page panier
     9. Validation des formulaires
    10. Amorcage
   ========================================================================== */
(function () {
	"use strict";

	var DK = window.DK;

	/* Si products.js n'a pas ete charge, on ne casse pas le site. */
	if (!DK) {
		return;
	}

	/* ======================================================================
	   1. Utilitaires
	   ====================================================================== */

	/** Echappe le texte avant injection en HTML. */
	function esc(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	/** Formate un montant en francs CFA. */
	function money(amount) {
		try {
			return (
				new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) +
				" FCFA"
			);
		} catch (e) {
			return amount + " FCFA";
		}
	}

	/** Accorde un mot au pluriel. */
	function plural(n, one, many) {
		return n > 1 ? many : one;
	}

	function $(selector, scope) {
		return (scope || document).querySelector(selector);
	}

	function $$(selector, scope) {
		return Array.prototype.slice.call(
			(scope || document).querySelectorAll(selector)
		);
	}

	/** Crée un élément à partir d'un fragment HTML. */
	function fromHTML(html) {
		var tpl = document.createElement("template");
		tpl.innerHTML = html.trim();
		return tpl.content.firstElementChild;
	}

	/** Retarde l'execution d'une fonction. */
	function debounce(fn, wait) {
		var timer = null;
		return function () {
			var ctx = this;
			var args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function () {
				fn.apply(ctx, args);
			}, wait);
		};
	}

	/** Nom de la page courante, pour marquer le lien actif. */
	function currentPage() {
		var file = window.location.pathname.split("/").pop();
		return file || "index.html";
	}

	/** Normalise un texte : minuscules, sans accents. */
	function normalize(text) {
		return String(text || "")
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");
	}

	/* ======================================================================
	   2. Magasin du panier
	   ----------------------------------------------------------------------
	   Le panier est persisté dans localStorage : il survit au rechargement et
	   au changement de page. Avant, chaque page repartait avec un panier vide.
	   ====================================================================== */
	var STORE_KEY = "dk-shop-cart-v1";
	var listeners = [];
	var state = { items: [] };

	/* Lecture defensive : localStorage peut etre indisponible (navigation
	   privee, quota depasse, certains contextes file://). */
	function readStorage() {
		try {
			var raw = window.localStorage.getItem(STORE_KEY);
			if (!raw) return [];
			var parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			return [];
		}
	}

	function writeStorage(items) {
		try {
			window.localStorage.setItem(STORE_KEY, JSON.stringify(items));
		} catch (e) {
			/* Le panier reste utilisable en memoire pour la session. */
		}
	}

	/** Cle unique d'une ligne : produit + taille. */
	function lineKey(productId, size) {
		return productId + "::" + (size || "-");
	}

	function notify() {
		listeners.forEach(function (fn) {
			try {
				fn(state.items);
			} catch (e) {
				/* Un abonné défaillant ne doit pas casser le panier. */
			}
		});
	}

	function commit(items) {
		state.items = items;
		writeStorage(items);
		notify();
	}

	var Cart = {
		/** Restaure le panier au demarrage. */
		init: function () {
			state.items = readStorage().filter(function (line) {
				return line && DK.get(line.id) && line.qty > 0;
			});
			notify();
		},

		/** Abonnement aux changements du panier. */
		subscribe: function (fn) {
			listeners.push(fn);
			fn(state.items);
		},

		/** Lignes du panier. */
		items: function () {
			return state.items.slice();
		},

		/** Nombre d'articles. */
		count: function () {
			return state.items.reduce(function (sum, line) {
				return sum + line.qty;
			}, 0);
		},

		/** Sous-total d'une ligne. */
		lineTotal: function (line) {
			var product = DK.get(line.id);
			return product ? product.price * line.qty : 0;
		},

		/** Total du panier. */
		total: function () {
			return Cart.items().reduce(function (sum, line) {
				return sum + Cart.lineTotal(line);
			}, 0);
		},

		/** Economie totale realisee. */
		savings: function () {
			return Cart.items().reduce(function (sum, line) {
				var product = DK.get(line.id);
				if (!product || !product.oldPrice) return sum;
				return sum + (product.oldPrice - product.price) * line.qty;
			}, 0);
		},

		/**
		 * Ajoute un article. Si la même référence (et la même taille) est
		 * déjà présente, on incrémente la quantité au lieu de dupliquer.
		 */
		add: function (productId, qty, size) {
			var product = DK.get(productId);
			if (!product) return false;

			var amount = Math.max(1, parseInt(qty, 10) || 1);
			var key = lineKey(productId, size);
			var items = Cart.items();
			var found = null;

			items.forEach(function (line) {
				if (lineKey(line.id, line.size) === key) found = line;
			});

			if (found) {
				found.qty = Math.min(99, found.qty + amount);
			} else {
				items.push({ id: productId, qty: amount, size: size || null });
			}

			commit(items);
			return true;
		},

		/** Change la quantité d'une ligne. Mettre 0 la supprime. */
		setQty: function (productId, size, qty) {
			var key = lineKey(productId, size);
			var amount = parseInt(qty, 10);
			var items = Cart.items();

			if (!amount || amount < 1) {
				return Cart.remove(productId, size);
			}

			items = items.map(function (line) {
				if (lineKey(line.id, line.size) === key) {
					line.qty = Math.min(99, amount);
				}
				return line;
			});

			commit(items);
		},

		/** Supprime une ligne. */
		remove: function (productId, size) {
			var key = lineKey(productId, size);
			commit(
				Cart.items().filter(function (line) {
					return lineKey(line.id, line.size) !== key;
				})
			);
		},

		/** Vide le panier. */
		clear: function () {
			commit([]);
		}
	};

	/* ======================================================================
	   3. Notifications (toasts)
	   ====================================================================== */
	var Toast = {
		container: null,

		mount: function () {
			if (Toast.container) return;
			Toast.container = fromHTML(
				'<div class="toasts" role="status" aria-live="polite"></div>'
			);
			document.body.appendChild(Toast.container);
		},

		show: function (message, kind) {
			Toast.mount();
			var type = kind === "error" ? "err" : "ok";
			var icon = type === "err" ? "bi-exclamation-circle" : "bi-check-circle";
			var node = fromHTML(
				'<div class="toast toast--' +
					type +
					'"><i class="bi ' +
					icon +
					'" aria-hidden="true"></i><span>' +
					esc(message) +
					"</span></div>"
			);
			Toast.container.appendChild(node);

			requestAnimationFrame(function () {
				node.classList.add("is-visible");
			});

			setTimeout(function () {
				node.classList.remove("is-visible");
				setTimeout(function () {
					if (node.parentNode) node.parentNode.removeChild(node);
				}, 300);
			}, 2800);
		}
	};

	/* ======================================================================
	   4. Panneaux (tiroir panier, navigation mobile, menu compte)
	   ----------------------------------------------------------------------
	   Un seul voile (scrim) est partage, avec une pile de panneaux : fermer le
	   panneau du dessus ne doit pas fermer ceux du dessous.
	   ====================================================================== */
	var Panels = {
		stack: [],
		scrim: null,
		lastFocus: null,

		mount: function () {
			if (Panels.scrim) return;
			Panels.scrim = fromHTML('<div class="scrim" hidden></div>');
			Panels.scrim.addEventListener("click", function () {
				Panels.closeTop();
			});
			document.body.appendChild(Panels.scrim);
		},

		/**
		 * Ouvre un panneau.
		 * @param {string} id       identifiant du panneau
		 * @param {Element} panel   element a afficher
		 * @param {boolean} lock    geler le défilement de la page
		 */
		open: function (id, panel, lock) {
			Panels.mount();

			if (Panels.stack.indexOf(id) === -1) {
				if (Panels.stack.length === 0) {
					Panels.lastFocus = document.activeElement;
				}
				Panels.stack.push(id);
			}

			panel.classList.add("is-open");
			panel.removeAttribute("aria-hidden");
			Panels.scrim.hidden = false;

			requestAnimationFrame(function () {
				Panels.scrim.classList.add("is-open");
			});

			if (lock) document.body.classList.add("is-locked");

			/* Amène le focus à l'intérieur du panneau. */
			var focusable = panel.querySelector("button, [href], input, select, textarea");
			if (focusable) focusable.focus();
		},

		close: function (id) {
			var index = Panels.stack.indexOf(id);
			if (index === -1) return;
			Panels.stack.splice(index, 1);

			var panel = document.getElementById(id);
			if (panel) {
				panel.classList.remove("is-open");
				panel.setAttribute("aria-hidden", "true");
			}

			if (Panels.stack.length === 0) {
				Panels.scrim.classList.remove("is-open");
				document.body.classList.remove("is-locked");

				setTimeout(function () {
					if (Panels.stack.length === 0) Panels.scrim.hidden = true;
				}, 300);

				if (Panels.lastFocus && Panels.lastFocus.focus) {
					Panels.lastFocus.focus();
				}
				Panels.lastFocus = null;
			}
		},

		closeTop: function () {
			if (Panels.stack.length) {
				Panels.close(Panels.stack[Panels.stack.length - 1]);
			}
		},

		/** Empeche la tabulation de sortir du panneau du dessus. */
		trapFocus: function (event) {
			if (event.key !== "Tab" || !Panels.stack.length) return;

			var panel = document.getElementById(Panels.stack[Panels.stack.length - 1]);
			if (!panel) return;

			var items = $$(
				'a[href], button:not([disabled]), input:not([disabled]),' +
					' select:not([disabled]), textarea:not([disabled]),' +
					' [tabindex]:not([tabindex="-1"])',
				panel
			).filter(function (el) {
				return el.offsetParent !== null;
			});

			if (!items.length) return;

			var first = items[0];
			var last = items[items.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	};

	/* ======================================================================
	   5. Rendu des composants
	   ====================================================================== */

	/**
	 * Construit le HTML d'une carte produit.
	 *
	 * Point important : c'est le lien du titre qui couvre toute la carte via
	 * un pseudo-element ::after. Le bouton « Ajouter » reste au-dessus en
	 * z-index et reste donc cliquable. On n'embarque plus un <button> dans
	 * un <a>, ce qui etait invalide et cassait la navigation au clavier.
	 */
	function cardHTML(product) {
		var discount = DK.discount(product);
		var href = "produit.html?id=" + encodeURIComponent(product.id);
		var category = DK.category(product.cat);
		var url = encodeURI(product.img);

		var flags = "";
		if (discount > 0) {
			flags += '<span class="badge badge--sale">-' + discount + " %</span>";
		}

		return (
			'<article class="card">' +
			'<a class="card__media" href="' +
			href +
			'" tabindex="-1" aria-hidden="true">' +
			'<div class="card__flags">' +
			flags +
			"</div>" +
			'<img class="card__img" src="' +
			esc(url) +
			'" alt="" loading="lazy" decoding="async" width="400" height="400">' +
			"</a>" +
			'<div class="card__body">' +
			(category
				? '<span class="card__cat">' + esc(category.name) + "</span>"
				: "") +
			'<h3 class="card__title"><a href="' +
			href +
			'">' +
			esc(product.name) +
			"</a></h3>" +
			(product.subtitle
				? '<p class="card__sub">' + esc(product.subtitle) + "</p>"
				: "") +
			'<p class="card__price">' +
			'<span class="price-now">' +
			esc(money(product.price)) +
			"</span>" +
			(product.oldPrice && product.oldPrice > product.price
				? '<span class="price-was">' + esc(money(product.oldPrice)) + "</span>"
				: "") +
			"</p>" +
			'<div class="card__foot">' +
			'<button type="button" class="btn btn--outline btn--sm btn--block" ' +
			'data-dk-add="' +
			esc(product.id) +
			'"><i class="bi bi-bag-plus" aria-hidden="true"></i> Ajouter</button>' +
			"</div>" +
			"</div>" +
			"</article>"
		);
	}

	/** Remplit un conteneur par une liste de produits. */
	function renderGrid(container, products) {
		if (!container) return;

		if (!products.length) {
			container.innerHTML =
				'<div class="empty">' +
				'<i class="bi bi-search empty__icon" aria-hidden="true"></i>' +
				'<h3 class="empty__title">Aucun produit trouvé</h3>' +
				"<p>Essayez un autre mot-clé ou parcourez toutes nos catégories.</p>" +
				"</div>";
			return;
		}

		container.innerHTML = products.map(cardHTML).join("");
	}

	/** Rendu d'une ligne d'article du panier. */
	function cartLineHTML(line) {
		var product = DK.get(line.id);
		if (!product) return "";

		var href = "produit.html?id=" + encodeURIComponent(product.id);

		return (
			'<div class="cart-line" data-line="' +
			esc(lineKey(line.id, line.size)) +
			'">' +
			'<a class="cart-line__media" href="' +
			href +
			'" tabindex="-1" aria-hidden="true">' +
			'<img class="cart-line__img" src="' +
			esc(encodeURI(product.img)) +
			'" alt="" loading="lazy" width="68" height="68">' +
			"</a>" +
			'<div class="cart-line__info">' +
			'<a class="cart-line__name" href="' +
			href +
			'">' +
			esc(product.name) +
			"</a>" +
			(line.size
				? '<p class="cart-line__variant">Taille ' + esc(line.size) + "</p>"
				: "") +
			'<div class="cart-line__controls">' +
			'<div class="qty">' +
			'<button type="button" class="qty__btn" data-dk-dec ' +
			'aria-label="Diminuer la quantité">' +
			'<i class="bi bi-dash" aria-hidden="true"></i></button>' +
			'<input class="qty__input" type="number" min="1" max="99" value="' +
			line.qty +
			'" data-dk-qty aria-label="Quantité">' +
			'<button type="button" class="qty__btn" data-dk-inc ' +
			'aria-label="Augmenter la quantité">' +
			'<i class="bi bi-plus" aria-hidden="true"></i></button>' +
			"</div>" +
			"</div>" +
			"</div>" +
			'<div class="cart-line__right">' +
			'<span class="cart-line__price">' +
			esc(money(Cart.lineTotal(line))) +
			"</span>" +
			'<button type="button" class="cart-line__remove" data-dk-remove ' +
			'aria-label="Retirer ' +
			esc(product.name) +
			' du panier">' +
			'<i class="bi bi-trash3" aria-hidden="true"></i></button>' +
			"</div>" +
			"</div>"
		);
	}

	/* --- Compteur du panier ---------------------------------------------- */
	function syncCount() {
		var count = Cart.count();
		$$("[data-dk-count]").forEach(function (node) {
			node.textContent = count > 99 ? "99+" : String(count);
			node.setAttribute("data-count", String(count));
			node.setAttribute(
				"aria-label",
				count + " " + plural(count, "article", "articles") + " dans le panier"
			);
		});
	}

	/* --- Navigation des catégories ---------------------------------------- */
	function renderCatNav(list, activeId) {
		if (!list) return;

		list.innerHTML = DK.categories
			.map(function (category) {
				var n = DK.byCategory(category.id).length;
				var current = category.id === activeId ? ' aria-current="true"' : "";
				return (
					'<li><a class="cat-nav__link" href="' +
					esc(category.page) +
					'"' +
					current +
					"><i class=\"bi " +
					esc(category.icon) +
					"\" aria-hidden=\"true\"></i><span>" +
					esc(category.name) +
					'</span><span class="cat-nav__count">' +
					n +
					"</span></a></li>"
				);
			})
			.join("");
	}

	/* --- Carousel (bandeau d'accueil) ------------------------------------- */
	function mountHero(root) {
		var track = $("[data-dk-hero-track]", root);
		var dots = $("[data-dk-hero-dots]", root);
		if (!track) return;

		var slides = $$("[data-dk-hero-slide]", track);
		if (slides.length < 2) {
			if (dots) dots.remove();
			$$("[data-dk-hero-prev], [data-dk-hero-next]", root).forEach(function (button) {
				button.remove();
			});
			return;
		}

		var index = 0;
		var timer = null;
		var DELAY = 6000;

		if (dots) {
			dots.innerHTML = slides
				.map(function (slide, i) {
					return (
						'<button type="button" class="hero__dot" data-dk-hero-dot="' +
						i +
						'" aria-label="Diapositive ' +
						(i + 1) +
						'"></button>'
					);
				})
				.join("");
		}

		function show(next) {
			index = (next + slides.length) % slides.length;
			track.style.transform = "translateX(-" + index * 100 + "%)";
			slides.forEach(function (slide, i) {
				slide.setAttribute("aria-hidden", i === index ? "false" : "true");
			});
			$$("[data-dk-hero-dot]", root).forEach(function (dot, i) {
				dot.setAttribute("aria-current", i === index ? "true" : "false");
			});
		}

		function stop() {
			if (timer) clearInterval(timer);
			timer = null;
		}

		function start() {
			stop();
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			timer = setInterval(function () {
				show(index + 1);
			}, DELAY);
		}

		root.addEventListener("click", function (event) {
			var prev = event.target.closest("[data-dk-hero-prev]");
			var next = event.target.closest("[data-dk-hero-next]");
			var dot = event.target.closest("[data-dk-hero-dot]");

			if (prev) {
				show(index - 1);
				start();
			} else if (next) {
				show(index + 1);
				start();
			} else if (dot) {
				show(parseInt(dot.getAttribute("data-dk-hero-dot"), 10));
				start();
			}
		});

		root.addEventListener("mouseenter", stop);
		root.addEventListener("mouseleave", start);
		root.addEventListener("focusin", stop);
		root.addEventListener("keydown", function (event) {
			if (event.key === "ArrowLeft") {
				show(index - 1);
				start();
			}
			if (event.key === "ArrowRight") {
				show(index + 1);
				start();
			}
		});

		document.addEventListener("visibilitychange", function () {
			if (document.hidden) stop();
			else start();
		});

		show(0);
		start();
	}

	/* --- Tiroir panier ---------------------------------------------------- */
	function renderCartDrawer(body) {
		var items = Cart.items();

		if (!items.length) {
			body.innerHTML =
				'<div class="cart-drawer__empty">' +
				'<i class="bi bi-bag-x" aria-hidden="true"></i>' +
				"<p><strong>Votre panier est vide</strong></p>" +
				"<p>Parcourez la boutique et ajoutez vos articles préférés.</p>" +
				'<a class="btn btn--primary" href="index.html">' +
				"Découvrir la boutique</a>" +
				"</div>";
			return;
		}

		body.innerHTML = items.map(cartLineHTML).join("");
	}

	function renderCartTotals(scope) {
		var total = Cart.total();
		var savings = Cart.savings();

		$$("[data-dk-total]", scope).forEach(function (node) {
			node.textContent = money(total);
		});

		$$("[data-dk-savings]", scope).forEach(function (node) {
			if (savings > 0) {
				node.textContent = "Vous économisez " + money(savings);
				node.hidden = false;
			} else {
				node.hidden = true;
			}
		});

		$$("[data-dk-checkout]", scope).forEach(function (button) {
			button.disabled = Cart.count() === 0;
		});
	}

	/* ======================================================================
	   6. Recherche
	   ====================================================================== */
	var Search = {
		input: null,
		panel: null,

		mount: function (form) {
			Search.input = $("[data-dk-search-input]", form);
			Search.panel = $("[data-dk-search-results]", form);
			if (!Search.input || !Search.panel) return;

			var run = debounce(function () {
				Search.render(Search.input.value);
			}, 160);

			Search.input.addEventListener("input", run);
			Search.input.addEventListener("focus", function () {
				Search.render(Search.input.value);
			});

			form.addEventListener("submit", function (event) {
				event.preventDefault();
				Search.navigate(Search.input.value);
			});

			document.addEventListener("click", function (event) {
				if (!form.contains(event.target)) Search.close();
			});

			Search.input.addEventListener("keydown", function (event) {
				if (event.key === "Escape") {
					Search.close();
					Search.input.blur();
				}
			});
		},

		/** Produits correspondant a une requete. */
		matches: function (query) {
			var q = normalize(query).trim();
			if (q.length < 1) return [];

			return DK.products
				.filter(function (product) {
					var category = DK.category(product.cat);
					return (
						normalize(product.name).indexOf(q) !== -1 ||
						normalize(product.subtitle).indexOf(q) !== -1 ||
						normalize(category ? category.name : "").indexOf(q) !== -1
					);
				})
				.slice(0, 6);
		},

		render: function (query) {
			if (!Search.panel) return;
			var q = normalize(query).trim();

			if (!q) {
				Search.close();
				return;
			}

			var results = Search.matches(query);

			if (!results.length) {
				Search.panel.innerHTML =
					'<p class="search__none">Aucun produit ne correspond a « ' +
					esc(query.trim()) +
					' ».</p>';
			} else {
				Search.panel.innerHTML =
					'<ul class="search__list">' +
					results
						.map(function (product) {
							return (
								'<li><a class="search__item" href="produit.html?id=' +
								encodeURIComponent(product.id) +
								'"><img class="search__thumb" src="' +
								esc(encodeURI(product.img)) +
								'" alt="" loading="lazy" width="40" height="40">' +
								'<span class="search__info">' +
								'<span class="search__name">' +
								esc(product.name) +
								"</span>" +
								'<span class="search__cat">' +
								esc(product.subtitle || "") +
								"</span></span>" +
								'<span class="search__price">' +
								esc(money(product.price)) +
								"</span></a></li>"
							);
						})
						.join("") +
					"</ul>";
			}

			Search.panel.hidden = false;
		},

		navigate: function (query) {
			var results = Search.matches(query);
			if (results.length === 1) {
				window.location.href =
					"produit.html?id=" + encodeURIComponent(results[0].id);
				return;
			}
			if (!results.length) {
				Toast.show("Aucun produit ne correspond à cette recherche.", "error");
			}
		},

		close: function () {
			if (Search.panel) Search.panel.hidden = true;
		}
	};

	/* ======================================================================
	   7. Fiche produit
	   ====================================================================== */
	function renderProductPage(main) {
		var params = new URLSearchParams(window.location.search);
		var id = params.get("id") || main.getAttribute("data-dk-product");
		var product = DK.get(id);

		if (!product) {
			main.innerHTML =
				'<div class="empty">' +
				'<i class="bi bi-exclamation-circle empty__icon" aria-hidden="true"></i>' +
				'<h1 class="empty__title">Produit introuvable</h1>' +
				"<p>Cette fiche produit n'existe pas ou n'est plus en ligne.</p>" +
				'<a class="btn btn--primary" href="index.html">' +
				"Retour à l'accueil</a></div>";
			return;
		}

		/* Titre et description de la page, pour le SEO et le partage. */
		document.title = product.name + " - DK SPIRIT";
		var metaDesc = $('meta[name="description"]');
		if (metaDesc && product.subtitle) {
			metaDesc.setAttribute("content", product.name + " - " + product.subtitle);
		}

		var category = DK.category(product.cat);
		var sizes = DK.sizesOf(product);
		var discount = DK.discount(product);

		/* Produits proches : même catégorie en priorité. */
		var related = DK.byCategory(product.cat).filter(function (p) {
			return p.id !== product.id;
		});
		if (related.length < 4) {
			DK.products.forEach(function (p) {
				if (p.id !== product.id && related.indexOf(p) === -1 && related.length < 4) {
					related.push(p);
				}
			});
		}

		var sizesBlock = "";
		if (sizes.length) {
			sizesBlock =
				'<div class="pdp__group">' +
				'<div class="pdp__group-head">' +
				'<span class="pdp__group-label" id="dkSizeLabel">Taille</span>' +
				'<span class="pdp__group-value" data-dk-size-value></span>' +
				"</div>" +
				'<div class="sizes" role="group" aria-labelledby="dkSizeLabel">' +
				sizes
					.map(function (size) {
						return (
							'<button type="button" class="size" data-dk-size="' +
							esc(size) +
							'" aria-pressed="false">' +
							esc(size) +
							"</button>"
						);
					})
					.join("") +
				"</div>" +
				'<p class="field__error" data-dk-size-error></p>' +
				"</div>";
		}

		main.innerHTML =
			'<nav class="crumbs" aria-label="Fil d\'Ariane">' +
			'<a href="index.html">Accueil</a>' +
			'<span class="crumbs__sep" aria-hidden="true">/</span>' +
			'<a href="' +
			esc(category ? category.page : "index.html") +
			'">' +
			esc(category ? category.name : "Boutique") +
			"</a>" +
			'<span class="crumbs__sep" aria-hidden="true">/</span>' +
			"<span>" +
			esc(product.name) +
			"</span>" +
			"</nav>" +

			'<div class="pdp">' +
			'<div class="pdp__media">' +
			'<div class="pdp__flags">' +
			(discount > 0 ? '<span class="badge badge--sale">-' + discount + " %</span>" : "") +
			(product.featured ? '<span class="badge badge--new">Nouveau</span>' : "") +
			"</div>" +
			'<img src="' +
			esc(encodeURI(product.img)) +
			'" alt="' +
			esc(product.name) +
			'" width="700" height="700">' +
			"</div>" +

			'<div class="pdp__info">' +
			'<p class="pdp__eyebrow">' +
			esc(category ? category.name : "") +
			"</p>" +
			'<h1 class="pdp__title">' +
			esc(product.name) +
			"</h1>" +
			(product.subtitle ? '<p class="pdp__sub">' + esc(product.subtitle) + "</p>" : "") +

			'<div class="pdp__price">' +
			'<span class="pdp__price-now">' +
			esc(money(product.price)) +
			"</span>" +
			(product.oldPrice && product.oldPrice > product.price
				? '<span class="pdp__price-was">' +
				  esc(money(product.oldPrice)) +
				  "</span>" +
				  '<span class="pdp__price-save">-' +
				  discount +
				  " %</span>"
				: "") +
			"</div>" +

			'<p class="pdp__desc">' +
			esc(product.desc) +
			"</p>" +
			sizesBlock +

			'<div class="pdp__group">' +
			'<div class="pdp__group-head">' +
			'<span class="pdp__group-label" id="dkQtyLabel">Quantité</span>' +
			"</div>" +
			'<div class="qty" role="group" aria-labelledby="dkQtyLabel">' +
			'<button type="button" class="qty__btn" data-dk-pdp-dec ' +
			'aria-label="Diminuer la quantité"><i class="bi bi-dash" aria-hidden="true"></i></button>' +
			'<input class="qty__input" type="number" min="1" max="99" value="1" data-dk-pdp-qty aria-label="Quantité">' +
			'<button type="button" class="qty__btn" data-dk-pdp-inc ' +
			'aria-label="Augmenter la quantité"><i class="bi bi-plus" aria-hidden="true"></i></button>' +
			"</div>" +
			"</div>" +

			'<div class="pdp__buy">' +
			'<button type="button" class="btn btn--accent btn--lg" data-dk-pdp-add="' +
			esc(product.id) +
			'"><i class="bi bi-bag-plus" aria-hidden="true"></i> Ajouter au panier</button>' +
			'<a class="btn btn--outline btn--lg" href="' +
			esc(category ? category.page : "index.html") +
			'">Voir la catégorie</a>' +
			"</div>" +

			'<div class="pdp__reassure">' +
			'<p class="pdp__reassure-item"><i class="bi bi-truck" aria-hidden="true"></i>' +
			"<span>Livraison à Dakar en 24 h, partout au Sénégal en 2 à 4 jours ouvrés.</span></p>" +
			'<p class="pdp__reassure-item"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>' +
			"<span>Retour gratuit sous 7 jours, échange en boutique également possible.</span></p>" +
			'<p class="pdp__reassure-item"><i class="bi bi-shield-check" aria-hidden="true"></i>' +
			"<span>Paiement sécurisé à la commande. Aucun frais caché, prix affiché TTC.</span></p>" +
			"</div>" +
			"</div>" +
			"</div>" +

			'<section class="section">' +
			'<div class="section-head"><div class="section-head__text">' +
			'<h2 class="section-head__title">Vous aimerez aussi</h2>' +
			'<p class="section-head__sub">Une sélection de la même collection.</p>' +
			"</div></div>" +
			'<div class="grid" data-dk-related></div>' +
			"</section>";

		renderGrid($("[data-dk-related]", main), related.slice(0, 4));
	}

	/* ======================================================================
	   8. Page panier
	   ====================================================================== */
	function renderCartPage() {
		var list = $("[data-dk-cart-list]");
		if (!list) return;

		function paint() {
			var items = Cart.items();

			if (!items.length) {
				list.innerHTML =
					'<div class="empty">' +
					'<i class="bi bi-bag empty__icon" aria-hidden="true"></i>' +
					'<h2 class="empty__title">Votre panier est vide</h2>' +
					"<p>Vous n'avez pas encore d'article. Parcourez la boutique et " +
					"trouvez votre prochaine pièce.</p>" +
					'<a class="btn btn--primary" href="index.html">' +
					"Voir la boutique</a></div>";
				$$("[data-dk-cart-shell]").forEach(function (node) {
					node.hidden = true;
				});
				return;
			}

			$$("[data-dk-cart-shell]").forEach(function (node) {
				node.hidden = false;
			});

			list.innerHTML =
				'<div class="cart-table__head" aria-hidden="true">' +
				"<span>Article</span><span>Quantité</span><span>Total</span>" +
				"</div>" +
				items
					.map(function (line) {
						var product = DK.get(line.id);
						if (!product) return "";
						var href = "produit.html?id=" + encodeURIComponent(product.id);
						return (
							'<div class="cart-table__row">' +
							'<a class="cart-line__media" href="' +
							href +
							'" tabindex="-1" aria-hidden="true">' +
							'<img class="cart-line__img" src="' +
							esc(encodeURI(product.img)) +
							'" alt="" loading="lazy" width="68" height="68"></a>' +
							'<div class="cart-line__info">' +
							'<a class="cart-line__name" href="' +
							href +
							'">' +
							esc(product.name) +
							"</a>" +
							(line.size
								? '<p class="cart-line__variant">Taille ' +
								  esc(line.size) +
								  "</p>"
								: "") +
							'<p class="cart-line__variant">' +
							esc(money(product.price)) +
							" l'unité</p>" +
							"</div>" +
							'<div class="cart-line__controls">' +
							'<div class="qty">' +
							'<button type="button" class="qty__btn" data-dk-dec ' +
							'aria-label="Diminuer la quantité">' +
							'<i class="bi bi-dash" aria-hidden="true"></i></button>' +
							'<input class="qty__input" type="number" min="1" max="99" value="' +
							line.qty +
							'" data-dk-qty aria-label="Quantité">' +
							'<button type="button" class="qty__btn" data-dk-inc ' +
							'aria-label="Augmenter la quantité">' +
							'<i class="bi bi-plus" aria-hidden="true"></i></button>' +
							"</div>" +
							"</div>" +
							'<div class="cart-line__right">' +
							'<span class="cart-line__price">' +
							esc(money(Cart.lineTotal(line))) +
							"</span>" +
							'<button type="button" class="cart-line__remove" data-dk-remove ' +
							'aria-label="Retirer du panier">' +
							'<i class="bi bi-trash3" aria-hidden="true"></i></button>' +
							"</div>" +
							"</div>"
						);
					})
					.join("");

			renderCartTotals(document);
		}

		Cart.subscribe(paint);
	}

	/* ======================================================================
	   9. Validation des formulaires
	   ====================================================================== */
	var Validation = {
		rules: {
			required: function (value) {
				return value.trim().length > 0 || "Ce champ est obligatoire.";
			},
			email: function (value) {
				if (!value.trim()) return "Ce champ est obligatoire.";
				return (
					/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim()) ||
					"Adresse e-mail invalide (exemple : nom@domaine.com)."
				);
			},
			tel: function (value) {
				if (!value.trim()) return "Ce champ est obligatoire.";
				var digits = value.replace(/[\s.\-()]/g, "");
				return (
					/^[0-9]{9}$/.test(digits) ||
					"Numéro invalide. Format attendu : 77 123 45 67."
				);
			},
			minlen: function (value, arg) {
				if (!value) return "Ce champ est obligatoire.";
				return (
					value.length >= arg ||
					"Le mot de passe doit contenir au moins " + arg + " caractères."
				);
			}
		},

		/** Lit les contraintes declarees sur un champ. */
		check: function (field) {
			/* Pour une case a cocher, ce qui compte est l'etat, pas la valeur. */
			var value =
				field.type === "checkbox" ? (field.checked ? field.value : "") : field.value;
			var problems = [];

			/* Les contraintes sont portees par l'attribut data-rule du champ
			   lui-même, pas par des éléments enfants. Plusieurs règles se
			   separent par un espace : data-rule="required minlen:8". */
			var tokens = (field.getAttribute("data-rule") || "").split(/\s+/);

			tokens.forEach(function (token) {
				if (!token) return;
				var parts = token.split(":");
				var rule = Validation.rules[parts[0]];
				if (!rule) return;
				var result = rule(value, parts[1] ? parseInt(parts[1], 10) : undefined);
				if (result !== true) problems.push(result);
			});

			/* Confirmation de mot de passe. */
			if (field.hasAttribute("data-match")) {
				var other = document.getElementById(field.getAttribute("data-match"));
				if (other && other.value !== value) {
					problems.push("Les deux mots de passe ne correspondent pas.");
				}
			}

			return problems;
		},

		paint: function (field, problems) {
			var box = document.getElementById(field.id + "-error");
			var ok = problems.length === 0;

			field.setAttribute("aria-invalid", ok ? "false" : "true");
			if (box) box.textContent = ok ? "" : problems[0];
			return ok;
		},

		validate: function (form) {
			var valid = true;
			var firstBad = null;

			$$("[data-rule]", form).forEach(function (field) {
				if (field.type === "hidden") return;
				if (!Validation.paint(field, Validation.check(field))) {
					valid = false;
					if (!firstBad) firstBad = field;
				}
			});

			if (firstBad) firstBad.focus();
			return valid;
		}
	};

	/* ======================================================================
	   10. Amorcage
	   ====================================================================== */

	/** Relit produit + taille d'une ligne de panier depuis le DOM. */
	function parseLine(scope) {
		if (!scope) return null;

		var key = scope.getAttribute("data-line");
		if (key) {
			var parts = key.split("::");
			return { id: parts[0], size: parts[1] === "-" ? null : parts[1] };
		}

		/* Les lignes de la page panier n'ont pas data-line : on passe par le
		   lien du produit, dont l'identifiant est stable. */
		var link = $(".cart-line__name", scope);
		if (!link) return null;

		var match = (link.getAttribute("href") || "").match(/id=([^&]+)/);
		if (!match) return null;

		var size = null;
		var variant = $(".cart-line__variant", scope);
		if (variant && /Taille/.test(variant.textContent)) {
			size = variant.textContent.replace(/Taille\s*/, "").trim();
		}

		return { id: decodeURIComponent(match[1]), size: size };
	}

	function openCart() {
		var drawer = $("[data-dk-cart-drawer]");
		if (drawer) Panels.open("dkCartDrawer", drawer, true);
	}

	function initHeader() {
		var page = currentPage();

		/* Marque le lien de navigation correspondant a la page courante. */
		$$("[data-dk-nav]").forEach(function (link) {
			if (link.getAttribute("data-dk-nav") === page) {
				link.setAttribute("aria-current", "page");
			}
		});

		/* Ouverture et fermeture des panneaux. */
		$$("[data-dk-open]").forEach(function (trigger) {
			trigger.addEventListener("click", function () {
				var id = trigger.getAttribute("data-dk-open");
				var panel = document.getElementById(id);
				if (panel) Panels.open(id, panel, true);
			});
		});

		$$("[data-dk-close]").forEach(function (trigger) {
			trigger.addEventListener("click", function () {
				Panels.close(trigger.getAttribute("data-dk-close"));
			});
		});

		/* Menu du compte. */
		var accountToggle = $("[data-dk-account-toggle]");
		var accountMenu = $("[data-dk-account-menu]");

		if (accountToggle && accountMenu) {
			accountToggle.setAttribute(
				"aria-label",
				accountToggle.getAttribute("aria-label") || "Ouvrir le menu du compte"
			);

			accountToggle.addEventListener("click", function (event) {
				event.stopPropagation();
				var open = accountMenu.classList.toggle("is-open");
				accountToggle.setAttribute("aria-expanded", open ? "true" : "false");
			});

			document.addEventListener("click", function (event) {
				if (
					!accountMenu.contains(event.target) &&
					!accountToggle.contains(event.target)
				) {
					accountMenu.classList.remove("is-open");
					accountToggle.setAttribute("aria-expanded", "false");
				}
			});

			document.addEventListener("keydown", function (event) {
				if (event.key === "Escape" && accountMenu.classList.contains("is-open")) {
					accountMenu.classList.remove("is-open");
					accountToggle.setAttribute("aria-expanded", "false");
					accountToggle.focus();
				}
			});
		}

		/* Recherche. */
		$$("[data-dk-search]").forEach(Search.mount);
	}

	/** Delegation globale : un seul ecouteur pour tous les boutons du panier. */
	function initCartEvents() {
		document.addEventListener("click", function (event) {
			var target = event.target;

			/* --- Ajouter une carte produit --- */
			var add = target.closest("[data-dk-add]");
			if (add) {
				event.preventDefault();
				var id = add.getAttribute("data-dk-add");
				var product = DK.get(id);
				var sizes = product ? DK.sizesOf(product) : [];
				var size = sizes.length ? sizes[1] || sizes[0] : null;

				if (Cart.add(id, 1, size)) {
					Toast.show((product ? product.name : "Article") + " ajouté au panier.");
					openCart();
				}
				return;
			}

			/* --- Ajouter depuis une fiche produit --- */
			var pdpAdd = target.closest("[data-dk-pdp-add]");
			if (pdpAdd) {
				event.preventDefault();

				var productId = pdpAdd.getAttribute("data-dk-pdp-add");
				var info = pdpAdd.closest(".pdp__info");
				var qtyInput = info ? $("[data-dk-pdp-qty]", info) : null;
				var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
				var chosen = info ? $('[data-dk-size][aria-pressed="true"]', info) : null;
				var sizeValue = chosen ? chosen.getAttribute("data-dk-size") : null;
				var sizeError = info ? $("[data-dk-size-error]", info) : null;

				/* Un produit textile doit avoir une taille. */
				if (DK.sizesOf(DK.get(productId)).length && !sizeValue) {
					if (sizeError) {
						sizeError.textContent = "Choisissez une taille pour continuer.";
					}
					return;
				}

				if (sizeError) sizeError.textContent = "";

				var added = DK.get(productId);
				Cart.add(productId, qty, sizeValue);
				Toast.show(
					(added ? added.name : "Article") +
						(sizeValue ? " (taille " + sizeValue + ")" : "") +
						" ajouté au panier."
				);
				openCart();
				return;
			}

			/* --- Choix de la taille --- */
			var sizeBtn = target.closest("[data-dk-size]");
			if (sizeBtn) {
				var group = sizeBtn.closest(".sizes");
				$$("[data-dk-size]", group).forEach(function (btn) {
					btn.setAttribute("aria-pressed", "false");
				});
				sizeBtn.setAttribute("aria-pressed", "true");

				var head = group.closest(".pdp__group");
				var label = $("[data-dk-size-value]", head);
				if (label) label.textContent = sizeBtn.getAttribute("data-dk-size");

				var err = $("[data-dk-size-error]", head);
				if (err) err.textContent = "";
				return;
			}

			/* --- Quantité sur une fiche produit --- */
			if (target.closest("[data-dk-pdp-inc]") || target.closest("[data-dk-pdp-dec]")) {
				var input = $("[data-dk-pdp-qty]");
				if (input) {
					var delta = target.closest("[data-dk-pdp-inc]") ? 1 : -1;
					input.value = String(
						Math.min(99, Math.max(1, (parseInt(input.value, 10) || 1) + delta))
					);
				}
				return;
			}

			/* --- Quantité dans le panier --- */
			if (target.closest("[data-dk-inc]") || target.closest("[data-dk-dec]")) {
				var row = target.closest("[data-line]") ||
					target.closest(".cart-table__row");
				var qtyField = row ? $("[data-dk-qty]", row) : null;
				if (!qtyField) return;
				event.preventDefault();

				var step = target.closest("[data-dk-inc]") ? 1 : -1;
				var nextValue = Math.min(
					99,
					Math.max(0, (parseInt(qtyField.value, 10) || 1) + step)
				);
				var line = parseLine(row);
				if (line) Cart.setQty(line.id, line.size, nextValue);
				return;
			}

			/* --- Retirer une ligne --- */
			var removeBtn = target.closest("[data-dk-remove]");
			if (removeBtn) {
				event.preventDefault();
				var target2 = parseLine(
					removeBtn.closest("[data-line]") ||
						removeBtn.closest(".cart-table__row")
				);
				if (target2) {
					var product = DK.get(target2.id);
					Cart.remove(target2.id, target2.size);
					Toast.show(
						(product ? product.name : "Article") + " retiré du panier."
					);
				}
				return;
			}

			/* --- Vider le panier --- */
			if (target.closest("[data-dk-clear]")) {
				event.preventDefault();
				Cart.clear();
				Toast.show("Panier vide.");
				return;
			}

			/* --- Valider la commande --- */
			if (target.closest("[data-dk-checkout]")) {
				event.preventDefault();

				if (Cart.count() === 0) {
					Toast.show("Votre panier est vide.", "error");
					return;
				}

				Toast.show(
					"Commande de " + money(Cart.total()) + " enregistrée. Merci !"
				);
			}
		});

		/* Saisie directe de la quantité. */
		document.addEventListener("change", function (event) {
			if (!event.target.matches("[data-dk-qty]")) return;

			var row = event.target.closest("[data-line]") ||
				event.target.closest(".cart-table__row");
			var line = parseLine(row);
			if (line) {
				Cart.setQty(line.id, line.size, parseInt(event.target.value, 10));
			}
		});
	}

	/** Bascule des catégories sur mobile. */
	function initCatToggle() {
		$$("[data-dk-cat-toggle]").forEach(function (toggle) {
			toggle.addEventListener("click", function () {
				var target = document.getElementById(toggle.getAttribute("data-dk-cat-toggle"));
				if (!target) return;
				var open = target.classList.toggle("is-open");
				toggle.setAttribute("aria-expanded", open ? "true" : "false");
			});
		});
	}

	/** Formulaires. */
	function initForms() {
		$$("[data-dk-form]").forEach(function (form) {
			/* Validation a la volee, des que le champ a ete quitte. */
			$$("[data-rule]", form).forEach(function (field) {
				field.addEventListener("blur", function () {
					if (field.value.trim()) {
						Validation.paint(field, Validation.check(field));
					}
				});
				field.addEventListener("input", function () {
					if (field.getAttribute("aria-invalid") === "true") {
						Validation.paint(field, Validation.check(field));
					}
				});
			});

			form.addEventListener("submit", function (event) {
				event.preventDefault();

				if (!Validation.validate(form)) {
					Toast.show("Merci de corriger les champs signalés.", "error");
					return;
				}

				var kind = form.getAttribute("data-dk-form");

				if (kind === "signup") {
					Toast.show("Compte créé. Bienvenue chez DK SPIRIT !");
				} else if (kind === "login") {
					Toast.show("Connexion réussie. Bonne visite !");
				} else if (kind === "contact") {
					Toast.show("Message envoyé. Nous vous répondons sous 24 h.");
					form.reset();
				}
			});
		});
	}

	/**
	 * Liste les produits correspondant a un descripteur de grille.
	 * Le descripteur est soit un mot-clé (featured, all, promo), soit une ou
	 * plusieurs catégories séparées par des virgules ("pulls,joggers").
	 */
	function productsFor(what) {
		if (what === "featured") return DK.featured();
		if (what === "all") return DK.products.slice();
		if (what === "promo") {
			return DK.products.filter(function (p) {
				return DK.discount(p) > 0;
			});
		}

		return what
			.split(",")
			.map(function (id) {
				return id.trim();
			})
			.filter(Boolean)
			.reduce(function (acc, id) {
				return acc.concat(DK.byCategory(id));
			}, []);
	}

	/** Rend les grilles de produits demandees par la page. */
	function initGrids() {
		$$("[data-dk-grid]").forEach(function (container) {
			var products = productsFor(container.getAttribute("data-dk-grid"));
			renderGrid(container, products);
			setResultCount(products.length);
		});
	}

	function setResultCount(n) {
		$$("[data-dk-result-count]").forEach(function (node) {
			node.textContent = String(n);
		});
	}

	/** Filtre de recherche sur la grille d'une catégorie. */
	function initFilter() {
		$$("[data-dk-filter]").forEach(function (input) {
			var container = document.getElementById(input.getAttribute("data-dk-filter"));
			if (!container) return;

			var catId = container.getAttribute("data-dk-grid");

			input.addEventListener(
				"input",
				debounce(function () {
					var q = normalize(input.value).trim();
					var products = productsFor(catId);

					if (q) {
						products = products.filter(function (p) {
							return (
								normalize(p.name).indexOf(q) !== -1 ||
								normalize(p.subtitle).indexOf(q) !== -1
							);
						});
					}

					renderGrid(container, products);
					setResultCount(products.length);
				}, 160)
			);
		});
	}

	function init() {
		Cart.init();
		Cart.subscribe(syncCount);

		initHeader();
		initCartEvents();
		initCatToggle();
		initForms();
		initGrids();
		initFilter();

		/* Tiroir panier. */
		var cartBody = $("[data-dk-cart-body]");
		if (cartBody) {
			Cart.subscribe(function () {
				renderCartDrawer(cartBody);
				renderCartTotals(document);

				var badge = $("[data-dk-drawer-count]");
				if (badge) {
					badge.textContent =
						Cart.count() + " " + plural(Cart.count(), "article", "articles");
				}
			});
		}

		/* Navigation des catégories : toutes les listes présentes sur la
		   page (menu lateral, tiroir mobile) sont remplies depuis le
		   catalogue, pour éviter de dupliquer les noms a la main.
		   L'attribut data-dk-catnav-list vaut l'identifiant de la catégorie
		   courante, ou rien si la liste n'est pas contextualisee. */
		$$("[data-dk-catnav-list]").forEach(function (list) {
			renderCatNav(list, list.getAttribute("data-dk-catnav-list") || null);
		});

		/* Carousel. */
		$$("[data-dk-hero]").forEach(mountHero);

		/* Fiche produit. */
		var pdp = $("[data-dk-product]");
		if (pdp) renderProductPage(pdp);

		/* Page panier. */
		renderCartPage();

		/* Fermeture au clavier des panneaux + piege de focus. */
		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape") Panels.closeTop();
			Panels.trapFocus(event);
		});

		/* Annee du pied de page. */
		$$("[data-dk-year]").forEach(function (node) {
			node.textContent = String(new Date().getFullYear());
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
