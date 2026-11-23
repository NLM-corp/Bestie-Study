"use strict";
// Bestie Study — routeur et démarrage
// Fichier chargé dans l'ordre par index.html : les fichiers partagent les mêmes variables globales.

  /* ---------------- Root render / router ---------------- */
  function render() {
    // Le nettoyage des overlays passe AVANT tout le reste (et hors du try/catch) : même si une erreur
    // survient plus loin dans le rendu de la page, une modale ouverte ne doit jamais rester bloquée à
    // l'écran alors que l'action a déjà eu lieu (ex. génération d'un cours démarrée en arrière-plan).
    document.querySelectorAll(".modal-overlay").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".dp-merchant-overlay").forEach(function (el) { el.remove(); });
    try {
      dtStopWalkLoop();
      if (!DB.currentUser) { renderAuth(parseHash()[0] === "signup" ? "signup" : "login"); return; }
      if (bestiePicking || !bestieChosen()) { renderBestiePicker(); return; }
      // L'appli est un simple site statique sans clé partagée : chaque visiteur doit fournir la sienne
      // (gratuite) pour que la génération fonctionne chez lui. Sans ce guide, quelqu'un qui découvre
      // Bestie Study sans savoir ce qu'est une "clé API Gemini" se retrouve juste avec des boutons qui ne
      // font rien. Ne se déclenche qu'une fois par chargement de page (pas à chaque render), pour ne
      // pas rouvrir la modale en boucle si l'utilisateur la ferme sans ajouter de clé.
      if (!getApiKey() && !apiKeyGuideShown) {
        apiKeyGuideShown = true;
        if (!modal) modal = { type: "apiKeyGuide" };
      }
      var parts = parseHash();
      if (parts.length === 0) { renderDashboard(); return; }
      if (parts[0] === "subject" && parts[1] && parts[2] === "theme" && parts[3] && parts[4] === "chapter" && parts[5]) { renderChapterPage(parts[1], parts[3], parts[5]); return; }
      if (parts[0] === "subject" && parts[1] && parts[2] === "theme" && parts[3]) { renderThemePage(parts[1], parts[3]); return; }
      if (parts[0] === "subject" && parts[1]) { renderSubjectPage(parts[1]); return; }
      if (parts[0] === "course" && parts[1]) { renderCoursePage(parts[1], parts[2]); return; }
      if (parts[0] === "exercices" && parts[1]) { renderImportedExercisePage(parts[1]); return; }
      if (parts[0] === "exercices") { renderImportedExercisesPage(); return; }
      if (parts[0] === "dinopark") { renderDinoParkPage(); return; }
      if (parts[0] === "dinotime") { renderDinoTimePage(); return; }
      if (parts[0] === "revision" && parts[1]) { renderRevisionSheetPage(parts[1]); return; }
      if (parts[0] === "examprep" && parts[1]) { renderExamPrepDetailPage(parts[1]); return; }
      if (parts[0] === "examprep") { renderExamPrepListPage(); return; }
      if (parts[0] === "methodologies" && parts[1]) { renderMethodologyDetailPage(parts[1]); return; }
      if (parts[0] === "methodologies") { renderMethodologyListPage(); return; }
      if (parts[0] === "today") { renderTodayPage(); return; }
      if (parts[0] === "review") { renderReviewPage(); return; }
      if (parts[0] === "calendar") { renderCalendarPage(); return; }
      if (parts[0] === "podcasts" && parts[1] === "lib") { renderPodcastLibraryPage(parts[2], parts[3], parts[4]); return; }
      if (parts[0] === "podcasts" && parts[1]) { renderPodcastDetailPage(parts[1]); return; }
      if (parts[0] === "podcasts") { renderPodcastListPage(); return; }
      renderDashboard();
    } catch (err) {
      console.error("Erreur de rendu :", err);
      toast("Un problème d'affichage est survenu — réessaie ou recharge la page.");
    }
  }

  var APP_COLORS = ["vert", "bleu", "jaune", "rose", "violet", "rouge", "orange"];
  var APP_COLOR_LABELS = { vert: "Vert", bleu: "Bleu", jaune: "Jaune", rose: "Rose", violet: "Violet", rouge: "Rouge", orange: "Orange" };
  (function initTheme() {
    var saved = localStorage.getItem("bestie_theme");
    var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-app-theme", theme);
    var savedColor = localStorage.getItem("bestie_color");
    document.documentElement.setAttribute("data-app-color", APP_COLORS.indexOf(savedColor) !== -1 ? savedColor : "rose");
  })();

  // Le chargement de la base (IndexedDB, potentiellement avec migration depuis l'ancien localStorage
  // au tout premier lancement) est asynchrone : on affiche un écran d'attente le temps que ça charge,
  // puis on démarre le routeur/rendu normalement — aucune interaction n'est possible avant coup.
  // Appli installable sur l'écran d'accueil (téléphone / ordinateur).
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) { reg.update(); }).catch(function (err) { console.warn("Service worker :", err); });
    });
    // Une nouvelle version vient de prendre la main juste après l'ouverture : on recharge une fois pour
    // afficher tout de suite les nouvelles images (pas plus tard, pour ne pas couper une séance en cours).
    var swHadController = !!navigator.serviceWorker.controller, swOpenedAt = Date.now(), swReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!swHadController || swReloaded || Date.now() - swOpenedAt > 15000) return;
      swReloaded = true; location.reload();
    });
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installPromptEvent = e; });
  window.addEventListener("appinstalled", function () { installPromptEvent = null; toast("📲 Bestie Study est installé sur ton écran d'accueil !"); });

  var appEl = document.getElementById("app");
  if (appEl) appEl.innerHTML = '<div class="processing-box" style="min-height:100vh;justify-content:center">' + genLogo() + '<span>Chargement…</span></div>';
  initDB().then(function () { markInterruptedPodcasts(); return hydratePodcastAudio().catch(function (err) { console.error("Audio des podcasts :", err); }).then(function () { return hydrateFigureImages().catch(function (err) { console.error("Images des schémas :", err); }); }); }).then(function () {
    window.addEventListener("hashchange", render);
    window.addEventListener("resize", syncTopbarHeightVar);
    // À l'ouverture de l'appli, on arrive sur « Aujourd'hui » (le Menu reste à un clic).
    if (DB.currentUser && (!location.hash || location.hash === "#" || location.hash === "#/")) history.replaceState(null, "", "#/today");
    // Demande au navigateur de ne pas effacer nos données en cas de manque de place.
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    render();
    if (DB.currentUser && backupNeeded()) setTimeout(function () { toast("💾 Pense à sauvegarder tes données (page Aujourd'hui)"); }, 2500);
    if (DB.currentUser) checkRevisionReminder();

    setInterval(function () {
      if (!DB.currentUser) return;
      ["dp-shop-timer", "dp-shop-timer-mini"].forEach(function (elId) {
        var el = document.getElementById(elId);
        if (!el) return;
        var zoneId = el.getAttribute("data-zone");
        var shop = dpData().shops[zoneId];
        if (!shop) return;
        var remain = shop.expiresAt - Date.now();
        if (remain <= 0) { render(); return; }
        el.textContent = (el.hasAttribute("data-bare") ? "" : "⏳ ") + dpFormatCountdown(remain);   // data-bare : l'icône est déjà à côté
      });
      document.querySelectorAll(".dp-inc-timer").forEach(function (el) {
        var i = +el.getAttribute("data-slot");
        var inc = dpData().incubators[i];
        if (!inc) { render(); return; }
        var sp = dpSpecies(inc.speciesId);
        if (!sp) return;
        var rarity = DP_RARITY[sp.rarity];
        var remain = rarity.hatch * 1000 - (Date.now() - inc.startedAt);
        if (remain <= 0) { render(); return; }
        el.textContent = "⏳ " + dpFormatCountdown(remain);
      });
      if (epSession && epSession.startedAt && !epSession.done) {
        var epTimerEl = document.getElementById("ep-session-timer");
        if (epTimerEl) epTimerEl.textContent = "⏱️ " + dpFormatCountdown(Date.now() - epSession.startedAt);
      }
    }, 1000);
  });

  /* ---------------- Pancartes en bois et plaques en métal dessinées à la bonne taille ----------------
     Avant, on étirait une petite image : les bords s'épaississaient et les clous se déformaient selon la
     taille du bouton. Maintenant chaque pancarte est redessinée pixel par pixel pour sa taille exacte
     (1 pixel du dessin = SIGN_PX pixels à l'écran) : on rajoute des pixels de planche au milieu, le bord,
     le trait entre les deux planches et les clous restent fins et à leur place. */
  var SIGN_PX = 4;
  var SIGN_SEL = {
    wood: ".stat-card, .tile-sign-short, .tile-sign-long, .dp-actions .btn, .dp-zone-sign, .dp-merchant-trigger, .dp-subject-card, .dt-duration-btn, .dt-pomo-field-card",
    metal: ".btn-metal, .tile-sign-metal, .dp-enc-sign, .dt-pomo-field-input"
  };
  var SIGN_COL = {
    wood: { o: "#A04570", hi: "#FFE6F0", mid: "#F9C4D8", lo: "#EFA3C1", stitch: "#FFFFFF", heart: "#E0507F" },
    metal: { o: "#6B4F8F", hi: "#F6EFFF", mid: "#DCCBF4", lo: "#C3ACE6", gloss: "#ECE2FB", spark: "#FFFFFF" }
  };
  var signCache = {};
  function signUrl(kind, W, H) {
    var key = kind + W + "x" + H;
    if (signCache[key]) return signCache[key];
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var c = cv.getContext("2d"), C = SIGN_COL[kind];
    var px = function (x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    var rect = function (x, y, w, h, col) { if (w > 0 && h > 0) { c.fillStyle = col; c.fillRect(x, y, w, h); } };
    rect(1, 0, W - 2, 1, C.o); rect(1, H - 1, W - 2, 1, C.o); rect(0, 1, 1, H - 2, C.o); rect(W - 1, 1, 1, H - 2, C.o);
    var lo = Math.max(4, H - 3);
    rect(1, 1, W - 2, 2, C.hi); rect(1, 3, W - 2, lo - 3, C.mid); rect(1, lo, W - 2, H - 1 - lo, C.lo);
    if (kind === "wood") {
      if (W >= 8 && H >= 7) { for (var x = 3; x < W - 3; x += 2) { px(x, 2, C.stitch); px(x, H - 3, C.stitch); } for (var y = 4; y < H - 3; y += 2) { px(2, y, C.stitch); px(W - 3, y, C.stitch); } }
      if (W >= 16 && H >= 10) [[4, 4], [W - 7, 4]].forEach(function (p) { [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]].forEach(function (d) { px(p[0] + d[0], p[1] + d[1], C.heart); }); });
    } else {
      for (var gx = 1; gx < W - 1; gx++) for (var gy = 3; gy < lo; gy++) if ((gx + gy) % 16 < 2) px(gx, gy, C.gloss);
      if (W >= 12 && H >= 9) [[3, 3], [W - 6, H - 6]].forEach(function (p) { [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].forEach(function (d) { px(p[0] + d[0], p[1] + d[1], C.spark); }); });
    }
    return (signCache[key] = cv.toDataURL("image/png"));
  }
  function paintSign(el, kind) {
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var W = Math.max(8, Math.round(w / SIGN_PX)), H = Math.max(7, Math.round(h / SIGN_PX)), key = W + "x" + H;
    if (el._signKey === key) return;
    el._signKey = key;
    el.style.backgroundImage = "url(" + signUrl(kind, W, H) + ")";
    el.style.backgroundSize = "100% 100%";
    el.style.imageRendering = "pixelated";
  }
  var signRO = typeof ResizeObserver !== "undefined" ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) { if (e.target._signKind) paintSign(e.target, e.target._signKind); });
  }) : null;
  function paintSigns() {
    Object.keys(SIGN_SEL).forEach(function (kind) {
      document.querySelectorAll(SIGN_SEL[kind]).forEach(function (el) {
        if (!el._signKind) { el._signKind = kind; if (signRO) signRO.observe(el); }
        paintSign(el, kind);
      });
    });
  }
  (function () {
    var queued = false;
    var mo = new MutationObserver(function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () { queued = false; paintSigns(); });
    });
    var start = function () { mo.observe(document.body, { childList: true, subtree: true }); paintSigns(); };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  })();


