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
     Ses scènes sont du pixel art de 192 × 108 (pixels de 10 × 10 dans l'image). On les redessine dans un
     canvas, pixel par pixel, environ 11 fois par seconde : il parle (bouche qui bouge seulement pendant
     que le son joue), cligne des yeux, fume (fumée qui monte du cigare, bout qui rougeoie), dort (des Z
     qui s'envolent, il ronfle bouche ouverte), la bougie vacille, les étoiles scintillent et parfois une
     étoile filante traverse la fenêtre. Si le canvas ne peut pas lire l'image, l'image fixe reste. */
  var PAPI_W = 192, PAPI_H = 108;
  var PAPI_EYES = [[73, 37], [81, 37], [21, 27], [29, 27], [161, 29], [169, 29]];
  function papiScene(src) {
    var f = decodeURIComponent(src || "").split("/").pop();
    return /Explique/.test(f) ? "talk" : /Attend4/.test(f) ? "sleep" : /Attend3/.test(f) ? "smoke" : /Attend2/.test(f) ? "back" : /Lis/.test(f) ? "read" : "idle";
  }
  function papiAnalyse(img) {
    var c = document.createElement("canvas"); c.width = PAPI_W; c.height = PAPI_H;
    var x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, PAPI_W, PAPI_H);
    var B = x.getImageData(0, 0, PAPI_W, PAPI_H).data;   // lève une erreur si l'image n'est pas lisible
    var px = function (X, Y) { var i = (Y * PAPI_W + X) * 4; return [B[i], B[i + 1], B[i + 2]]; };
    var sum = function (p) { return p[0] + p[1] + p[2]; };
    var A = { B: B, scene: papiScene(img.getAttribute("src")), eyes: [], mouth: [], flame: [], stars: [], erase: [], tip: [] };
    PAPI_EYES.forEach(function (e) { var p = px(e[0], e[1]); if (p[0] > 235 && p[1] > 235 && p[2] > 235) A.eyes.push(e); });
    var dark = function (p) { return p[0] > p[1] + 25 && p[0] < 175 && p[1] < 95; };   // intérieur rouge sombre de la bouche
    if (A.scene === "talk") for (var y = 49; y <= 52; y++) for (var i = 70; i <= 86; i++) if (dark(px(i, y))) A.mouth.push([i, y]);
    if (A.scene === "sleep") for (var y2 = 42; y2 <= 48; y2++) for (var i2 = 158; i2 <= 170; i2++) if (dark(px(i2, y2))) A.mouth.push([i2, y2]);
    // flamme de la bougie : pixels chauds et très clairs, à gauche
    var FL = { "255,176,64": 1, "255,255,255": 1, "255,224,112": 1 };   // orange, blanc, jaune de la flamme
    for (var y3 = 45; y3 <= 75; y3++) for (var i3 = 10; i3 <= 60; i3++) if (FL[px(i3, y3).join(",")]) A.flame.push([i3, y3]);
    if (A.flame.length > 12) A.flame = [];   // pas une flamme (zone trop claire)
    // étoiles : pixels clairs isolés sur le bleu de la fenêtre (la lune, elle, est entourée de clair)
    var blue = function (p) { return p[2] > p[0] + 25 && sum(p) < 420; };
    for (var y4 = 1; y4 < 75; y4++) for (var i4 = 140; i4 < PAPI_W - 1; i4++) { var p4 = px(i4, y4); if (sum(p4) > 600 && blue(px(i4 - 1, y4)) && blue(px(i4 + 1, y4)) && blue(px(i4, y4 - 1)) && blue(px(i4, y4 + 1))) A.stars.push([i4, y4]); }
    A.win = A.stars.length ? A.stars.reduce(function (b, s) { return [Math.min(b[0], s[0]), Math.min(b[1], s[1]), Math.max(b[2], s[0]), Math.max(b[3], s[1])]; }, [999, 999, 0, 0]) : null;
    if (A.scene === "sleep") {   // le Z dessiné dans le décor est remplacé par des Z qui s'envolent
      for (var y5 = 4; y5 <= 16; y5++) for (var i5 = 184; i5 < PAPI_W; i5++) { var p5 = px(i5, y5); if (p5[0] > 80 && sum(p5) > 250 && Math.abs(p5[0] - p5[2]) < 20) A.erase.push([i5, y5]); }
    }
    if (A.scene === "smoke") A.tip = [[175, 41]];   // bout du cigare (côté cendre, à droite)
    return A;
  }
  function papiFrame(A, O, t, talking) {
    var W = PAPI_W, B = A.B;
    O.set(B);
    var get = function (x, y) { var i = (y * W + x) * 4; return [O[i], O[i + 1], O[i + 2]]; };
    var put = function (x, y, c, a) { if (x < 0 || y < 0 || x >= W || y >= PAPI_H) return; var i = (y * W + x) * 4; a = a == null ? 1 : a; O[i] = O[i] * (1 - a) + c[0] * a; O[i + 1] = O[i + 1] * (1 - a) + c[1] * a; O[i + 2] = O[i + 2] * (1 - a) + c[2] * a; };
    var base = function (x, y) { var i = (y * W + x) * 4; return [B[i], B[i + 1], B[i + 2]]; };
    var hash = function (n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); };
    // décor retiré (le Z fixe) : couleur du premier pixel à gauche qui n'en fait pas partie
    A.erase.forEach(function (e) { var x = e[0]; while (x > 0 && A.erase.some(function (q) { return q[0] === x && q[1] === e[1]; })) x--; put(e[0], e[1], base(x, e[1])); });
    // clignement des yeux : une fois toutes les 3 à 6 s environ
    var bp = 4200, cyc = Math.floor(t / bp), into = t - cyc * bp, blinkAt = 600 + hash(cyc) * 2800;
    if (A.scene !== "sleep" && into > blinkAt && into < blinkAt + 160) A.eyes.forEach(function (e) { put(e[0], e[1], base(e[0] + 1, e[1])); });
    // bouche : elle bouge quand il parle (son en cours), fermée sinon ; il ronfle quand il dort
    if (A.mouth.length) {
      var state;
      if (A.scene === "talk") state = talking ? [2, 1, 2, 0, 1, 2, 1, 0][(Math.floor(t / 110) + Math.floor(t / 880) * 3) % 8] : 0;
      else state = (t % 3600) < 1800 ? 2 : 0;
      if (state < 2) { var top = Math.min.apply(null, A.mouth.map(function (m) { return m[1]; }));
        A.mouth.forEach(function (m) { if (state === 0 || m[1] > top) put(m[0], m[1], base(m[0], m[1] + 4)); }); }
    }
    // bougie qui vacille
    if (A.flame.length) {
      var v = Math.floor(hash(Math.floor(t / 130)) * 4), topY = Math.min.apply(null, A.flame.map(function (f) { return f[1]; })), tops = A.flame.filter(function (f) { return f[1] === topY; });
      if (v === 1) tops.forEach(function (f) { put(f[0], f[1] - 1, [255, 170, 60], 0.85); });
      else if (v === 2) tops.forEach(function (f) { put(f[0] - 1, f[1], base(f[0], f[1])); put(f[0], f[1], base(f[0], f[1] - 1)); });
      else if (v === 3) tops.forEach(function (f) { put(f[0], f[1], base(f[0], f[1] - 1), 0.7); });
    }
    // étoiles qui scintillent
    A.stars.forEach(function (s, i) { var k = Math.sin(t / 650 + i * 2.3) * Math.sin(t / 1730 + i); if (k < -0.35) put(s[0], s[1], base(s[0] - 1, s[1]), Math.min(0.85, (-k - 0.35) * 2.2)); });
    // étoile filante de temps en temps
    if (A.win) { var sp = 14000, sc = Math.floor(t / sp), sIn = t - sc * sp, sx0 = A.win[0] + hash(sc + 7) * (A.win[2] - A.win[0]) * 0.6;
      if (sIn < 700) { var q = sIn / 700; for (var k2 = 0; k2 < 4; k2++) { var xx = Math.round(sx0 + q * 18 - k2), yy = Math.round(A.win[1] + q * 9 - k2 * 0.5), c0 = get(xx, yy); if (c0[2] > c0[0] + 25) put(xx, yy, [255, 255, 235], (1 - k2 / 4) * (1 - q * 0.6)); } } }
    // fumée du cigare, bout qui rougeoie
    if (A.scene === "smoke") {
      var glow = 0.5 + 0.5 * Math.sin(t / 600);
      A.tip.forEach(function (p) { put(p[0], p[1], [255, 120, 50], 0.3 + 0.6 * glow); });
      var ox = A.tip.length ? Math.min.apply(null, A.tip.map(function (p) { return p[0]; })) : 175, oy = A.tip.length ? Math.min.apply(null, A.tip.map(function (p) { return p[1]; })) - 1 : 39;
var SM = [222, 222, 230];      for (var s2 = 0; s2 < 10; s2++) { var pr = ((t / 4000) + s2 / 10) % 1, sx = Math.round(ox + 2 + pr * 10 + Math.sin(pr * 6.5 + s2 * 0.9) * 1.6), sy = Math.round(oy - 1 - pr * 24), al = 0.95 * Math.min(1, pr * 5) * Math.pow(1 - pr, 0.8);        put(sx, sy, SM, al); put(sx + 1, sy, SM, al * 0.8); if (pr > 0.3) put(sx, sy - 1, SM, al * 0.7); if (pr > 0.55) { put(sx + 1, sy - 1, SM, al * 0.6); put(sx - 1, sy, SM, al * 0.5); } }
    }
    // il dort : des Z qui montent en grossissant
    if (A.scene === "sleep") {
      for (var z = 0; z < 3; z++) { var pz = ((t / 4200) + z / 3) % 1, n = pz < 0.33 ? 3 : pz < 0.66 ? 4 : 5, zx = Math.round(177 + pz * 9 + Math.sin(pz * 6) * 1.5), zy = Math.round(32 - pz * 27), za = Math.min(1, pz * 8) * Math.min(1, (1 - pz) * 4);
        for (var j = 0; j < n; j++) { put(zx + j, zy, [178, 182, 200], za); put(zx + j, zy + n - 1, [178, 182, 200], za); if (j > 0 && j < n - 1) put(zx + n - 1 - j, zy + j, [178, 182, 200], za); } }
    }
  }
  var papiAnims = [];
  function papiAttach(img) {
    img._papi = true;
    var cv = document.createElement("canvas"); cv.width = PAPI_W; cv.height = PAPI_H; cv.className = img.className + " papi-anim";
    papiAnims.push({ img: img, cv: cv, ctx: cv.getContext("2d"), A: null, src: null, out: null, t0: performance.now() - Math.random() * 5000 });
  }
  function papiPrepare(st) {
    var src = st.img.getAttribute("src");
    if (st.src === src) return !!st.A;
    if (!st.img.complete || !st.img.naturalWidth) return false;
    st.src = src;
    try { st.A = papiAnalyse(st.img); } catch (e) { st.A = null; st.img.style.visibility = ""; if (st.cv.parentNode) st.cv.parentNode.removeChild(st.cv); return false; }   // image non lisible : on garde l'image fixe
    st.out = st.ctx.createImageData(PAPI_W, PAPI_H);
    if (!st.cv.isConnected) st.img.parentNode.insertBefore(st.cv, st.img.nextSibling);
    st.img.style.visibility = "hidden";
    return true;
  }
  setInterval(function () {
    document.querySelectorAll("img.podcast-bg-img").forEach(function (img) { if (!img._papi) papiAttach(img); });
    if (!papiAnims.length) return;
    var audio = document.getElementById("podcast-audio"), talking = !!(audio && !audio.paused && !audio.ended);
    papiAnims = papiAnims.filter(function (st) {
      if (!st.img.isConnected) { if (st.cv.parentNode) st.cv.parentNode.removeChild(st.cv); return false; }
      if (document.hidden || !papiPrepare(st)) return true;
      papiFrame(st.A, st.out.data, performance.now() - st.t0, talking);
      st.ctx.putImageData(st.out, 0, 0);
      return true;
    });
  }, 90);
