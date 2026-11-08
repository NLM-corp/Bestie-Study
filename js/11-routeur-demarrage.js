"use strict";
// Studino — routeur et démarrage
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
      // L'appli est un simple site statique sans clé partagée : chaque visiteur doit fournir la sienne
      // (gratuite) pour que la génération fonctionne chez lui. Sans ce guide, quelqu'un qui découvre
      // Studino sans savoir ce qu'est une "clé API Gemini" se retrouve juste avec des boutons qui ne
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
    var saved = localStorage.getItem("recto_theme");
    var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-app-theme", theme);
    var savedColor = localStorage.getItem("recto_color");
    document.documentElement.setAttribute("data-app-color", APP_COLORS.indexOf(savedColor) !== -1 ? savedColor : "vert");
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
  window.addEventListener("appinstalled", function () { installPromptEvent = null; toast("📲 Studino est installé sur ton écran d'accueil !"); });

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
    wood: { o: "#24160c", top: "#a86c38", line: "#6a3e1c", bot: "#8a5528", nail: "#3a2a20" },
    metal: { o: "#1c2024", hi: "#9aa2a8", mid: "#6e767c", lo: "#4a5056", rivet: "#c8ced2", shadow: "#3a3f44" }
  };
  var signCache = {};
  function signUrl(kind, W, H) {
    var key = kind + W + "x" + H;
    if (signCache[key]) return signCache[key];
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var c = cv.getContext("2d"), C = SIGN_COL[kind];
    var px = function (x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    var rect = function (x, y, w, h, col) { if (w > 0 && h > 0) { c.fillStyle = col; c.fillRect(x, y, w, h); } };
    // contour d'un pixel, coins arrondis (pixel du coin vide)
    rect(1, 0, W - 2, 1, C.o); rect(1, H - 1, W - 2, 1, C.o); rect(0, 1, 1, H - 2, C.o); rect(W - 1, 1, 1, H - 2, C.o);
    var nailRows;
    if (kind === "wood") {
      var d = Math.ceil(H / 2);   // trait entre la planche du haut (plus claire) et celle du bas
      rect(1, 1, W - 2, d - 1, C.top); rect(1, d, W - 2, 1, C.line); rect(1, d + 1, W - 2, H - d - 2, C.bot);
      nailRows = [3]; if (H - 4 > d + 1) nailRows.push(H - 4);
      if (W >= 10) nailRows.forEach(function (y) { px(3, y, C.nail); px(W - 4, y, C.nail); });
    } else {
      // bande claire en haut (2 rangées), milieu, bande sombre en bas (3 rangées)
      var lo = Math.max(4, H - 4);
      rect(1, 1, W - 2, 2, C.hi); rect(1, 3, W - 2, lo - 3, C.mid); rect(1, lo, W - 2, H - 1 - lo, C.lo);
      nailRows = [3]; if (lo > 5) nailRows.push(lo);
      if (W >= 10) nailRows.forEach(function (y) { px(3, y, C.rivet); px(4, y + 1, C.shadow); px(W - 4, y, C.rivet); px(W - 3, y + 1, C.shadow); });
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


  /* ---------------- Le papi du podcast est animé ----------------
     Ses scènes sont du pixel art de 192 × 108 (pixels de 10 × 10 dans l'image), toutes dans la même pièce.
     On reconstruit la pièce vide (la couleur la plus fréquente de chaque pixel entre plusieurs scènes où il
     est à des endroits différents), et le papi de chaque scène est ce qui diffère de la pièce vide.
     On peut alors le faire respirer (le haut du corps monte d'un pixel et redescend), et le faire passer
     d'une scène à l'autre : il se lève, marche d'un endroit à l'autre (bureau, fenêtre, bibliothèque,
     fauteuil) et se rassoit, ou change de geste au bureau.
     Dans chaque scène : il parle (bouche qui bouge seulement pendant que le son joue), cligne des yeux,
     fume (fumée qui monte du cigare, bout qui rougeoie), dort (des Z qui s'envolent, il ronfle), la bougie
     vacille, les étoiles scintillent et parfois une étoile filante traverse la fenêtre.
     Si le canvas ne peut pas lire les images, l'image fixe reste. */
  var PAPI_W = 192, PAPI_H = 108;
  var PAPI_FILES = ["PapiAttend", "PapiAttend2", "PapiAttend3", "PapiAttend4", "PapiExplique", "PapiExplique2", "PapiExplique3", "PapiExplique4", "PapiExplique5", "PapiExplique6", "PapiLis"];
  var PAPI_BG_FROM = ["PapiAttend", "PapiAttend2", "PapiAttend3", "PapiExplique", "PapiLis"];   // il est à un endroit différent dans chacune
  var PAPI_EYES = [[73, 37], [81, 37], [21, 27], [29, 27], [161, 29], [169, 29]];
  var PAPI_DESK = { x0: 26, x1: 138, y: 74 };   // le devant du bureau, qui passe devant lui quand il est derrière
  function papiName(src) { var f = decodeURIComponent(src || "").split("/").pop().replace(/\.png.*$/, ""); return PAPI_FILES.indexOf(f) >= 0 ? f : null; }
  function papiPlace(name) { return /Explique|Lis/.test(name) ? "desk" : name === "PapiAttend2" ? "window" : name === "PapiAttend" ? "shelf" : "chair"; }
  function papiSceneKind(name) { return /Explique/.test(name) ? "talk" : name === "PapiAttend4" ? "sleep" : name === "PapiAttend3" ? "smoke" : name === "PapiAttend2" ? "back" : name === "PapiLis" ? "read" : "idle"; }

  // ---- analyse d'une scène (sur ses pixels 192 × 108)
  function papiAnalyseData(B, kind) {
    var px = function (X, Y) { var i = (Y * PAPI_W + X) * 4; return [B[i], B[i + 1], B[i + 2]]; };
    var sum = function (p) { return p[0] + p[1] + p[2]; };
    var A = { B: B, scene: kind, eyes: [], mouth: [], flame: [], stars: [], erase: [], tip: [] };
    PAPI_EYES.forEach(function (e) { var p = px(e[0], e[1]); if (p[0] > 235 && p[1] > 235 && p[2] > 235) A.eyes.push(e); });
    var dark = function (p) { return p[0] > p[1] + 25 && p[0] < 175 && p[1] < 95; };   // intérieur rouge sombre de la bouche
    if (kind === "talk") for (var y = 49; y <= 52; y++) for (var i = 70; i <= 86; i++) if (dark(px(i, y))) A.mouth.push([i, y]);
    if (kind === "sleep") for (var y2 = 42; y2 <= 48; y2++) for (var i2 = 158; i2 <= 170; i2++) if (dark(px(i2, y2))) A.mouth.push([i2, y2]);
    var FL = { "255,176,64": 1, "255,255,255": 1, "255,224,112": 1 };   // orange, blanc, jaune de la flamme
    for (var y3 = 45; y3 <= 75; y3++) for (var i3 = 10; i3 <= 60; i3++) if (FL[px(i3, y3).join(",")]) A.flame.push([i3, y3]);
    // étoiles : pixels clairs isolés sur le bleu de la fenêtre (la lune, elle, est entourée de clair)
    var blue = function (p) { return p[2] > p[0] + 25 && sum(p) < 420; };
    for (var y4 = 1; y4 < 75; y4++) for (var i4 = 140; i4 < PAPI_W - 1; i4++) { var p4 = px(i4, y4); if (sum(p4) > 600 && blue(px(i4 - 1, y4)) && blue(px(i4 + 1, y4)) && blue(px(i4, y4 - 1)) && blue(px(i4, y4 + 1))) A.stars.push([i4, y4]); }
    A.win = A.stars.length ? A.stars.reduce(function (b, s) { return [Math.min(b[0], s[0]), Math.min(b[1], s[1]), Math.max(b[2], s[0]), Math.max(b[3], s[1])]; }, [999, 999, 0, 0]) : null;
    if (kind === "sleep") for (var y5 = 4; y5 <= 16; y5++) for (var i5 = 184; i5 < PAPI_W; i5++) { var p5 = px(i5, y5); if (p5[0] > 80 && sum(p5) > 250 && Math.abs(p5[0] - p5[2]) < 20) A.erase.push([i5, y5]); }   // le Z dessiné dans le décor
    if (kind === "smoke") A.tip = [[175, 41]];   // bout du cigare (côté cendre, à droite)
    return A;
  }
  // ---- tout ce qui bouge dans une scène (sans la respiration)
  function papiEffects(A, O, t, talking, only) {
    var W = PAPI_W, B = A.B;
    var get = function (x, y) { var i = (y * W + x) * 4; return [O[i], O[i + 1], O[i + 2]]; };
    var put = function (x, y, c, a) { if (x < 0 || y < 0 || x >= W || y >= PAPI_H) return; var i = (y * W + x) * 4; a = a == null ? 1 : a; O[i] = O[i] * (1 - a) + c[0] * a; O[i + 1] = O[i + 1] * (1 - a) + c[1] * a; O[i + 2] = O[i + 2] * (1 - a) + c[2] * a; };
    var base = function (x, y) { var i = (y * W + x) * 4; return [B[i], B[i + 1], B[i + 2]]; };
    var hash = function (n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); };
    // bougie qui vacille
    if (A.flame.length) {
      var v = Math.floor(hash(Math.floor(t / 130)) * 4), topY = Math.min.apply(null, A.flame.map(function (f) { return f[1]; })), tops = A.flame.filter(function (f) { return f[1] === topY; });
      if (v === 1) tops.forEach(function (f) { put(f[0], f[1] - 1, [255, 170, 60], 0.85); });
      else if (v === 2) tops.forEach(function (f) { put(f[0] - 1, f[1], base(f[0], f[1])); put(f[0], f[1], base(f[0], f[1] - 1)); });
      else if (v === 3) tops.forEach(function (f) { put(f[0], f[1], base(f[0], f[1] - 1), 0.7); });
    }
    // étoiles qui scintillent, étoile filante de temps en temps
    A.stars.forEach(function (s, i) { var k = Math.sin(t / 650 + i * 2.3) * Math.sin(t / 1730 + i); if (k < -0.35) put(s[0], s[1], base(s[0] - 1, s[1]), Math.min(0.85, (-k - 0.35) * 2.2)); });
    if (A.win) { var sp = 14000, sc = Math.floor(t / sp), sIn = t - sc * sp, sx0 = A.win[0] + hash(sc + 7) * (A.win[2] - A.win[0]) * 0.6;
      if (sIn < 700) { var q = sIn / 700; for (var k2 = 0; k2 < 4; k2++) { var xx = Math.round(sx0 + q * 18 - k2), yy = Math.round(A.win[1] + q * 9 - k2 * 0.5), c0 = get(xx, yy); if (c0[2] > c0[0] + 25) put(xx, yy, [255, 255, 235], (1 - k2 / 4) * (1 - q * 0.6)); } } }
    if (only === "room") return;
    A.erase.forEach(function (e) { var x = e[0]; while (x > 0 && A.erase.some(function (q) { return q[0] === x && q[1] === e[1]; })) x--; put(e[0], e[1], base(x, e[1])); });
    // clignement des yeux : une fois toutes les 3 à 6 s environ
    var bp = 4200, cyc = Math.floor(t / bp), into = t - cyc * bp, blinkAt = 600 + hash(cyc) * 2800;
    if (A.scene !== "sleep" && into > blinkAt && into < blinkAt + 160) A.eyes.forEach(function (e) { put(e[0], e[1], base(e[0] + 1, e[1])); });
    // bouche : elle bouge quand il parle (son en cours), fermée sinon ; il ronfle quand il dort
    if (A.mouth.length) {
      var state;
      if (A.scene === "talk") state = talking ? [2, 1, 2, 0, 1, 2, 1, 0][(Math.floor(t / 110) + Math.floor(t / 880) * 3) % 8] : 0;
      else state = (t % 4400) < 2200 ? 2 : 0;
      if (state < 2) { var top = Math.min.apply(null, A.mouth.map(function (m) { return m[1]; }));
        A.mouth.forEach(function (m) { if (state === 0 || m[1] > top) put(m[0], m[1], base(m[0], m[1] + 4)); }); }
    }
    // fumée du cigare, bout qui rougeoie
    if (A.scene === "smoke") {
      var glow = 0.5 + 0.5 * Math.sin(t / 600), SM = [222, 222, 230];
      A.tip.forEach(function (p) { put(p[0], p[1], [255, 120, 50], 0.3 + 0.6 * glow); });
      var ox = A.tip[0][0], oy = A.tip[0][1] - 1;
      for (var s2 = 0; s2 < 10; s2++) { var pr = ((t / 4000) + s2 / 10) % 1, sx = Math.round(ox + 2 + pr * 10 + Math.sin(pr * 6.5 + s2 * 0.9) * 1.6), sy = Math.round(oy - 1 - pr * 24), al = 0.95 * Math.min(1, pr * 5) * Math.pow(1 - pr, 0.8);
        put(sx, sy, SM, al); put(sx + 1, sy, SM, al * 0.8); if (pr > 0.3) put(sx, sy - 1, SM, al * 0.7); if (pr > 0.55) { put(sx + 1, sy - 1, SM, al * 0.6); put(sx - 1, sy, SM, al * 0.5); } }
    }
    // il dort : des Z qui montent en grossissant
    if (A.scene === "sleep") {
      for (var z = 0; z < 3; z++) { var pz = ((t / 4200) + z / 3) % 1, n = pz < 0.33 ? 3 : pz < 0.66 ? 4 : 5, zx = Math.round(177 + pz * 9 + Math.sin(pz * 6) * 1.5), zy = Math.round(32 - pz * 27), za = Math.min(1, pz * 8) * Math.min(1, (1 - pz) * 4);
        for (var j = 0; j < n; j++) { put(zx + j, zy, [178, 182, 200], za); put(zx + j, zy + n - 1, [178, 182, 200], za); if (j > 0 && j < n - 1) put(zx + n - 1 - j, zy + j, [178, 182, 200], za); } }
    }
  }

  // ---- la pièce vide et le papi découpé dans chaque scène
  var PAPI = null;
  function papiBuild(datas) {   // datas : { nom: pixels RGBA 192 × 108 }
    var N = PAPI_W * PAPI_H, bg = new Uint8ClampedArray(N * 4), P = { bg: bg, S: {} };
    for (var p = 0; p < N; p++) { var cnt = {}, best = null, bc = 0;
      PAPI_BG_FROM.forEach(function (f) { var d = datas[f], i = p * 4, kk = d[i] + "," + d[i + 1] + "," + d[i + 2]; cnt[kk] = (cnt[kk] || 0) + 1; if (cnt[kk] > bc) bc = cnt[kk]; });
      var winner = null; PAPI_BG_FROM.some(function (f) { var d = datas[f], i = p * 4, kk = d[i] + "," + d[i + 1] + "," + d[i + 2]; if (cnt[kk] === bc) { winner = d; return true; } return false; });
      bg[p * 4] = winner[p * 4]; bg[p * 4 + 1] = winner[p * 4 + 1]; bg[p * 4 + 2] = winner[p * 4 + 2]; bg[p * 4 + 3] = 255; }
    PAPI_FILES.forEach(function (f) {
      var d = datas[f], m = new Uint8Array(N);
      for (var q = 0; q < N; q++) { var i = q * 4; if (Math.abs(d[i] - bg[i]) + Math.abs(d[i + 1] - bg[i + 1]) + Math.abs(d[i + 2] - bg[i + 2]) > 12) m[q] = 1; }
      // on garde le plus gros morceau (le papi) et ce qui le touche presque (fumée, Z, plume…)
      var lab = new Int32Array(N), sizes = [0], nl = 0;
      for (var s = 0; s < N; s++) if (m[s] && !lab[s]) { nl++; var st = [s], n = 0; lab[s] = nl; while (st.length) { var c = st.pop(); n++; var cx = c % PAPI_W, cy = (c - cx) / PAPI_W; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= PAPI_W || yy >= PAPI_H) continue; var o = yy * PAPI_W + xx; if (m[o] && !lab[o]) { lab[o] = nl; st.push(o); } } } sizes.push(n); }
      var big = 1; for (var l = 2; l <= nl; l++) if (sizes[l] > sizes[big]) big = l;
      var x0 = PAPI_W, x1 = 0, y0 = PAPI_H, y1 = 0, sx = 0, cnt2 = 0;
      for (var r = 0; r < N; r++) { m[r] = lab[r] === big ? 1 : 0; if (m[r]) { var rx = r % PAPI_W, ry = (r - rx) / PAPI_W; x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry); if (ry > y1 - 30) { sx += rx; cnt2++; } } }
      var kind = papiSceneKind(f);
      P.S[f] = { d: d, m: m, box: [x0, y0, x1, y1], cx: Math.round(sx / Math.max(1, cnt2)), A: papiAnalyseData(d, kind), kind: kind, place: papiPlace(f) };
    });
    // à la fenêtre, la fenêtre elle-même diffère un peu de la pièce vide : on ne garde que lui (pas le bleu, pas au-delà de son bord)
    var S2 = P.S.PapiAttend2;
    for (var w = 0; w < N; w++) if (S2.m[w]) { var wx = w % PAPI_W, wy = (w - wx) / PAPI_W, j = w * 4, bl = S2.d[j + 2] > S2.d[j] + 15;
      if (wx > 177 || (bl && wx > 160) || (wy < 9 && wx > 158)) S2.m[w] = 0; }
    // le papi qui marche, vu de face : le haut du corps d'une pose au bureau (un bras le long du corps)
    // et les jambes de la scène à la fenêtre (pantalon et bottes), placées juste en dessous
    var up = P.S.PapiExplique5, md = new Uint8Array(N), dd = new Uint8ClampedArray(N * 4), legDx = up.cx - 153;
    for (var u = 0; u < N; u++) { var ux = u % PAPI_W, uy = (u - ux) / PAPI_W;
      if (uy <= 71 && up.m[u]) { var uq = u - 8 * PAPI_W; md[uq] = 1; dd.set(up.d.subarray(u * 4, u * 4 + 4), uq * 4); }   // debout, il est 8 pixels plus haut
      if (uy >= 64 && uy <= 71 && ux <= 86 && !(uy <= 66 && ux >= 71 && ux <= 81) && up.m[u]) { md[u] = 1; dd.set(up.d.subarray(u * 4, u * 4 + 4), u * 4); }   // le bas du gilet, prolongé
      if (uy >= 72 && ux >= 128 && ux <= 165 && S2.m[u]) { var tx = ux + legDx, tq = uy * PAPI_W + tx; if (tx >= 0 && tx < PAPI_W) { md[tq] = 1; dd.set(S2.d.subarray(u * 4, u * 4 + 4), tq * 4); } } }
    var bx0 = PAPI_W, bx1 = 0, by0 = PAPI_H, by1 = 0; for (var v = 0; v < N; v++) if (md[v]) { var vx = v % PAPI_W, vy = (v - vx) / PAPI_W; bx0 = Math.min(bx0, vx); bx1 = Math.max(bx1, vx); by0 = Math.min(by0, vy); by1 = Math.max(by1, vy); }
    P.S.walker = { d: dd, m: md, box: [bx0, by0, bx1, by1], cx: up.cx, place: "walk" };
    P.roomA = papiAnalyseData(bg, "room");
    return P;
  }
  // ---- respiration : le haut du corps (au-dessus de la taille) monte d'un pixel
  var PAPI_BREATH = { desk: { waist: 71 }, shelf: { waist: 62 }, window: { waist: 60 }, chair: { waist: 60, x0: 148, x1: 184 } };
  function papiBreathe(O, S, bg, up, cfg) {
    if (!up) return;
    var W = PAPI_W, m = S.m, w = cfg.waist, x0 = cfg.x0 || 0, x1 = cfg.x1 || W - 1, C = new Uint8ClampedArray(O);
    for (var x = x0; x <= x1; x++) {
      for (var y2 = 1; y2 <= w; y2++) { var q2 = y2 * W + x; if (!m[q2]) continue; var dst = (q2 - W) * 4, src = q2 * 4; O[dst] = C[src]; O[dst + 1] = C[src + 1]; O[dst + 2] = C[src + 2]; }
      // le pixel du haut du corps qui n'a plus rien au-dessus de lui redevient la pièce, sauf à la taille (le torse s'allonge)
      for (var y3 = 1; y3 < w; y3++) { var q3 = y3 * W + x; if (m[q3] && !m[q3 + W]) { var i3 = q3 * 4; O[i3] = bg[i3]; O[i3 + 1] = bg[i3 + 1]; O[i3 + 2] = bg[i3 + 2]; } }
    }
  }
  function papiBreathUp(t, kind) { var per = kind === "sleep" ? 5200 : 3600; return (t % per) < per * 0.45 ? 1 : 0; }
  // une scène fixe, vivante
  function papiDrawScene(O, name, t, talking) {
    var S = PAPI.S[name]; O.set(S.d);
    papiEffects(S.A, O, t, talking);
    papiBreathe(O, S, PAPI.bg, papiBreathUp(t, S.kind), PAPI_BREATH[S.place]);
  }

  // ---- transitions
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // pose le papi d'une scène (ses pixels seulement), décalé de dx, dy ; level : part des pixels posés (fondu en trame)
  function papiPaste(O, S, dx, dy, level, legs, behindDesk) {
    var W = PAPI_W, m = S.m, d = S.d, b = S.box, hip = b[3] - 13, mid = S.cx;
    for (var y = b[1]; y <= b[3]; y++) for (var x = b[0]; x <= b[2]; x++) { var q = y * W + x; if (!m[q]) continue;
      var ly = 0; if (legs && y > hip) ly = (x < mid) === (legs === 1) ? -1 : 0;   // une jambe levée, puis l'autre
      var X = x + dx, Y = y + dy + ly; if (X < 0 || Y < 0 || X >= W || Y >= PAPI_H) continue;
      if (level < 1 && BAYER[(Y % 4) * 4 + (X % 4)] >= level * 16) continue;
      if (behindDesk && Y >= PAPI_DESK.y && X >= PAPI_DESK.x0 && X <= PAPI_DESK.x1) continue;
      var o = (Y * W + X) * 4, i = q * 4; O[o] = d[i]; O[o + 1] = d[i + 1]; O[o + 2] = d[i + 2]; }
  }
  var PAPI_WALK = "walker";        // il marche vu de face
  var PAPI_SPEED = 0.028;          // pixels du dessin par ms
  // le plan d'une transition : une liste d'étapes { d: durée, f: function (O, u) }
  function papiPlan(from, to) {
    var A = PAPI.S[from], B = PAPI.S[to], Wk = PAPI.S[PAPI_WALK], steps = [];
    var room = function (O, t) { O.set(PAPI.bg); papiEffects(PAPI.roomA, O, t, false, "room"); };
    var desk = function (x) { return x > 42; };
    // même endroit : fondu en trame d'une pose à l'autre
    if (A.place === B.place) {
      var dur = A.place === "desk" ? 450 : 1400;
      steps.push({ d: dur, f: function (O, u, t) { room(O, t); papiPaste(O, A, 0, 0, 1 - u, 0, false); papiPaste(O, B, 0, 0, u, 0, false); } });
      return steps;
    }
    var xa = A.place === "shelf" ? Wk.cx : A.cx, xb = B.place === "shelf" ? Wk.cx : B.cx;
    // 1. il se lève (ou se retourne) : sa pose devient le marcheur, au même endroit
    if (from !== PAPI_WALK) steps.push({ d: 500, f: function (O, u, t) { room(O, t); papiPaste(O, A, 0, Math.round(-2 * u), 1 - u, 0, false); papiPaste(O, Wk, xa - Wk.cx, 0, u, 0, desk(xa)); } });
    // 2. il marche
    var dist = Math.abs(xb - xa), walkMs = Math.max(600, dist / PAPI_SPEED);
    steps.push({ d: walkMs, f: function (O, u, t) { room(O, t); var x = Math.round(xa + (xb - xa) * u), ph = Math.floor(u * walkMs / 220); papiPaste(O, Wk, x - Wk.cx, -(ph % 2), 1, 1 + (ph % 2), desk(x)); } });
    // 3. il s'assoit (ou se retourne vers la fenêtre)
    if (to !== PAPI_WALK) steps.push({ d: 500, f: function (O, u, t) { room(O, t); papiPaste(O, Wk, xb - Wk.cx, 0, 1 - u, 0, desk(xb)); papiPaste(O, B, 0, Math.round(-2 * (1 - u)), u, 0, false); } });
    return steps;
  }
  function papiPlanDur(steps) { return steps.reduce(function (s, st) { return s + st.d; }, 0); }
  function papiDrawPlan(O, steps, tt, t) { for (var i = 0; i < steps.length; i++) { if (tt < steps[i].d || i === steps.length - 1) { steps[i].f(O, Math.max(0, Math.min(1, tt / steps[i].d)), t); return; } tt -= steps[i].d; } }

  // ---- dans l'app
  var papiAnims = [], papiLast = null, papiLoading = false;
  function papiLoad(dir) {
    if (PAPI || papiLoading) return; papiLoading = true;
    var datas = {}, left = PAPI_FILES.length, failed = false;
    PAPI_FILES.forEach(function (f) { var im = new Image(); im.onload = function () {
      try { var c = document.createElement("canvas"); c.width = PAPI_W; c.height = PAPI_H; var x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, PAPI_W, PAPI_H); datas[f] = x.getImageData(0, 0, PAPI_W, PAPI_H).data; } catch (e) { failed = true; }
      if (--left === 0 && !failed) { try { PAPI = papiBuild(datas); } catch (e2) { } } };
      im.onerror = function () { failed = true; left--; }; im.src = dir + f + ".png"; });
  }
  // les scènes d'attente de l'accueil : il change d'activité de temps en temps
  var PAPI_IDLE_NEXT = { PapiAttend: ["PapiAttend2", "PapiAttend3"], PapiAttend2: ["PapiAttend", "PapiAttend3"], PapiAttend3: ["PapiAttend4", "PapiAttend2", "PapiAttend"], PapiAttend4: ["PapiAttend3"] };
  function papiAttach(img) {
    img._papi = true;
    var cv = document.createElement("canvas"); cv.width = PAPI_W; cv.height = PAPI_H; cv.className = img.className + " papi-anim";
    papiAnims.push({ img: img, cv: cv, ctx: cv.getContext("2d"), out: null, name: null, plan: null, planT: 0, next: 0, t0: performance.now() - Math.random() * 5000 });
  }
  setInterval(function () {
    document.querySelectorAll("img.podcast-bg-img").forEach(function (img) { if (!img._papi) papiAttach(img); });
    if (!papiAnims.length) return;
    if (!PAPI) { papiLoad(typeof PODCAST_DIR !== "undefined" ? PODCAST_DIR : "assets/objects/vieux papi/"); return; }
    var audio = document.getElementById("podcast-audio"), talking = !!(audio && !audio.paused && !audio.ended), now = performance.now();
    papiAnims = papiAnims.filter(function (st) {
      if (!st.img.isConnected) { if (st.cv.parentNode) st.cv.parentNode.removeChild(st.cv); return false; }
      var want = papiName(st.img.getAttribute("src"));
      if (!want) return true;
      if (!st.out) { st.out = st.ctx.createImageData(PAPI_W, PAPI_H); st.img.parentNode.insertBefore(st.cv, st.img.nextSibling); st.img.style.visibility = "hidden";
        // il arrive d'une autre scène (l'accueil, la lecture…) : il vient jusqu'ici
        st.name = papiLast && papiLast !== want ? papiLast : want; st.next = now + 25000 + Math.random() * 15000; }
      if (!st.plan && want !== st.name) { st.plan = papiPlan(st.name, want); st.planT = now; st.planTo = want; }
      // sur l'accueil, il change d'activité de lui-même
      if (!st.plan && PAPI_IDLE_NEXT[st.name] && now > st.next) { var opts = PAPI_IDLE_NEXT[st.name], nx = opts[Math.floor(Math.random() * opts.length)]; st.img.setAttribute("src", st.img.getAttribute("src").replace(st.name, nx)); st.next = now + 25000 + Math.random() * 15000; return true; }
      if (document.hidden) return true;
      var t = now - st.t0;
      if (st.plan) { var tt = now - st.planT; if (tt >= papiPlanDur(st.plan)) { st.name = st.planTo; st.plan = null; } else papiDrawPlan(st.out.data, st.plan, tt, t); }
      if (!st.plan) papiDrawScene(st.out.data, st.name, t, talking);
      papiLast = st.plan ? st.planTo : st.name;
      st.ctx.putImageData(st.out, 0, 0);
      return true;
    });
  }, 90);
