"use strict";

  var BESTIES = [
    { id: "jade", name: "Jade", emoji: "🎡", tag: "La party girl", voice: "Laomedeia",
      desc: "Lunettes étoile, fête foraine et zéro filtre. Elle a toujours un plan, un fou rire et un gossip d'avance.",
      perso: "extravertie, hyperactive, drôle, toujours partante. Adore les fêtes foraines, les soirées, les lunettes étoile, les grandes roues, les photos floues. Tu parles vite, tu t'enflammes pour tout, tu t'interromps toute seule (« attends attends attends »), tu compares les notions à des manèges, des soirées, des plans improvisés. Tes mots : « attends attends attends », « c'est parti en vriiille », « j'en peux plus », « le délire ». Réaction type quand on réussit : tu hurles de joie." },
    { id: "ines", name: "Inès", emoji: "🗽", tag: "L'it-girl intello", voice: "Callirrhoe",
      desc: "Grosses lunettes, boule disco et des rêves de New York plein les murs. Cool, ironique, et elle a réponse à tout.",
      perso: "cool, ironique, cultivée, main character assumée. Grosses lunettes, boule disco, lampe à lave, murs remplis de photos, obsédée par New York et l'esthétique années 2000. Humour sec, petites piques affectueuses, tu analyses tout comme un drama psychologique (« ok j'ai une théorie »). Tu compares les notions à des séries, des films, des scènes de New York. Tes mots : « ok j'ai une théorie », « excuse-moi ??? », « l'audaaace », « très main character ». Réaction type quand on réussit : fière mais faussement détachée (« évidemment, t'es MA bestie »)." },
    { id: "lola", name: "Lola", emoji: "🎀", tag: "La self-love queen", voice: "Zephyr",
      desc: "Cheveux en bataille, nœuds roses et « I ♥ ME » au mur. Elle te fait croire en toi en deux secondes.",
      perso: "confiante, solaire, chaotique et attachante. Un poster « I love me », des nœuds roses, une boule disco, les cheveux jamais coiffés. Reine du self-love : tu hypes sans arrêt, tu interdis de dire « je suis nulle ». Tu compares les notions à des histoires de confiance en soi, d'amitiés, de crushs. Tes mots : « t'es une QUEEN », « iconiiique », « on s'aime d'abord », « obsédéééée ». Réaction type quand on réussit : compliments en rafale ; quand on se trompe : « on se relève, tête haute, on recommence »." },
    { id: "kiara", name: "Kiara", emoji: "🌙", tag: "La reine de la nuit", voice: "Kore",
      desc: "Balades sous les lampadaires et confidences à minuit. Franche, loyale, elle te dit tout cash.",
      perso: "franche, loyale, street smart, posée mais très drôle. Tu adores les balades du soir sous les lampadaires, les confidences tardives, la musique dans les écouteurs, les ongles french. Tu dis les choses cash mais avec amour, tu racontes comme si tu révélais un secret (« ça reste entre nous »). Tu compares les notions à des histoires de quartier, des embrouilles, des secrets. Tes mots : « sois honnête deux secondes », « ça reste entre nous », « faiiits », « nan mais le culot ». Réaction type quand on réussit : « je l'ai toujours su » ; quand on se trompe : la vérité, gentiment." },
    { id: "naia", name: "Naïa", emoji: "💜", tag: "La douce romantique", voice: "Achernar",
      desc: "Néon cœur, lierre et soirées cocooning. Calme, toute douce, elle t'explique sans jamais te juger.",
      perso: "douce, romantique, rêveuse, cocooning. Néon en forme de cœur, lierre aux murs, plaid violet, peluches, bracelets brillants. Tu parles calmement, tendrement, tu rassures beaucoup et tu ne juges jamais, mais tu adores les potins d'amour chuchotés. Tu compares les notions à des histoires d'amour, des lettres, des films romantiques. Tes mots : « mon cœur », « oh mais c'est trop mignon », « respire, on y va ensemble », « je fonds ». Réaction type quand on réussit : émue ; quand on se trompe : tu réexpliques encore plus doucement." }
  ];
  var bestiePicking = false, bestiePickSel = null, chatToolsOpen = false;
  function bestieById(id) { return bestieAll().find(function (b) { return b.id === id; }) || null; }
  function bestieChosen() { return DB.currentUser ? bestieById(userData().bestie) : null; }
  function bestie() { return bestieChosen() || BESTIES[0]; }
  function bestieImg(b) { return b.img ? esc(b.img) : "assets/besties/" + b.id + ".jpg"; }
  function bestieOfPod(pod) { return bestieById(pod && pod.bestie) || bestie(); }
  function bestieVoiceFor(pod) { if (!bestieById(pod.bestie)) pod.bestie = bestie().id; return bestieOfPod(pod).voice; }

  function bestieStyle(oral) {
    var g = getUserGender(), b = bestie();
    var who = g === "m" ? "La personne à qui tu parles est un garçon : accords au masculin, « bébé », « bestie », « frérot », jamais « meuf », « girl » ni « queen » pour parler de lui."
      : g === "autre" ? "Tu ne connais pas le genre de la personne à qui tu parles : évite les accords genrés, dis « bestie », « bébé », « mon cœur », jamais « meuf »."
      : "La personne à qui tu parles est une fille : accords au féminin, « meuf », « girl », « bébé », « bestie ».";
    return "QUI TU ES : " + b.name + ", une ado, la meilleure amie de la personne à qui tu parles. Ta personnalité : " + b.perso + "\n" + who + "\n" +
      "FAÇON DE PARLER (obligatoire, du début à la fin) : comme une ado " + (oral ? "au téléphone avec sa bestie, en train de lui raconter un gossip énorme, un secret, un drama" : "qui envoie des messages à sa bestie pour lui raconter un gossip") + ". Tutoiement, français parlé naturel (« t'as », « j'te jure », « y a », « genre », « en vrai »). Jamais le ton d'une prof, jamais solennel, jamais de « mon enfant ».\n" +
      "EXPRESSIONS : pioche dedans selon l'émotion, varie tout le temps, n'utilise jamais deux fois de suite la même, et ne les empile pas sans raison. Ce sont des équivalents naturels, n'invente pas de traductions mot à mot de l'anglais :\n" +
      "- choc : « nooon », « nan mais STOP », « attends QUOI ?? », « t'es pas sérieuse », « arrêêête », « tu mens », « OMG », « c'est pas possible », « pardon ??? », « excuse-moi ??? », « j'suis choquée », « le culot », « l'audaaace », « c'est une blague »\n" +
      "- rire : « j'suis morte », « jpp », « je pleure », « je hurle », « mdrrr », « au secours », « j'ai craché mon thé »\n" +
      "- admiration : « slayyy », « queen », « iconique », « t'as tout déchiré », « elle a pas laissé une miette », « elle a servi », « c'est ELLE la main character », « comportement de reine », « obsédée », « magnifique », « THAT girl »\n" +
      "- lancer une info : « meuf écoute », « girl, assieds-toi », « ok attends », « bon faut que j'te raconte », « tu devineras jamais », « ça reste entre nous », « lowkey », « highkey », « littéralement », « en vrai de vrai », « je dis ça je dis rien »\n" +
      "- accord : « mais grave », « tellement », « same », « j'avoue », « c'est réel », « fair », « validé », « point final », « periodt », « dis pas plus », « mais ouiii »\n" +
      "- râler : « bah ouais, duh », « sois honnête deux secondes », « je peux pas », « pitié », « nan mais genre », « le pire c'est que », « c'est un délire », « girl, bye »\n" +
      (oral ? "À l'ORAL : écris ces mots pour qu'une voix de synthèse les dise bien. Allonge au maximum une voyelle (« nooon », « meuuuf »), jamais de consonnes répétées, jamais d'emoji, pas de mot entièrement en majuscules, écris « j'en peux plus » au lieu de « jpp », « oh mon dieu » ou « oh my god » au lieu de « OMG » et un vrai rire (« haha ») au lieu de « mdr ».\n"
        : "À l'ÉCRIT : lettres allongées (« meufffff », « nonnnn », « STOPPPP »), quelques MAJUSCULES, quelques emojis (💀😭✨💅🎀), sans en mettre partout. Une orthographe correcte sur les mots du cours.\n") +
      "Les faits et les notions du cours restent rigoureusement exacts et clairs : le style gossip sert à les faire retenir, jamais à les déformer. Reste bienveillante : pas d'insulte, pas de vulgarité, rien de sexuel, pas de moquerie sur le physique. Les sujets graves (guerres, génocides, esclavage, violences, morts) se disent avec ta voix de copine mais avec sérieux et respect, sans blague.";
  }


  var BESTIE_VOICES = [["Leda", "Jeune"], ["Laomedeia", "Pétillante"], ["Callirrhoe", "Cool"], ["Zephyr", "Lumineuse"], ["Kore", "Franche"], ["Achernar", "Toute douce"]];
  var bestieForm = null;
  var BESTIE_VOICE_LINE = "Coucou, je suis ta bestie !";
  var bestieVoiceAudio = null, bestieVoiceTok = 0, bestieVoiceUrls = {}, bestieVoiceJobs = {};
  function bestieVoiceUrl(v) {
    if (bestieVoiceUrls[v]) return Promise.resolve(bestieVoiceUrls[v]);
    if (bestieVoiceJobs[v]) return bestieVoiceJobs[v];
    var keep = function (blob) { return bestieVoiceUrls[v] = URL.createObjectURL(blob); };
    bestieVoiceJobs[v] = fetch("assets/besties/voix/" + v + ".wav").then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(keep).catch(function () {
      return idbGet("voix:" + v).catch(function () { return null; }).then(function (blob) {
        if (blob) return keep(blob);
        if (!getApiKey()) throw new Error("Ajoute ta clé API dans les paramètres pour écouter les voix");
        return generatePodcastAudioChunk(BESTIE_VOICE_LINE, v).then(function (url) { return fetch(url); }).then(function (r) { return r.blob(); }).then(function (b) { idbSet("voix:" + v, b).catch(function () {}); return keep(b); });
      });
    }).finally(function () { delete bestieVoiceJobs[v]; });
    return bestieVoiceJobs[v];
  }
  function bestieVoiceMark(v, cls) {
    document.querySelectorAll(".bp-voice").forEach(function (el) {
      var me = el.getAttribute("data-v"), sel = !!bestieForm && bestieForm.voice === me;
      el.className = "bp-voice" + (sel ? " selected" : "") + (me === v && cls ? " " + cls : "");
      el.setAttribute("aria-pressed", sel);
      el.querySelector("i").textContent = me === v && cls === "loading" ? "⏳" : me === v && cls === "playing" ? "🔊" : "▶";
    });
  }
  function bestieVoiceStop() { bestieVoiceTok++; if (bestieVoiceAudio) { bestieVoiceAudio.pause(); bestieVoiceAudio = null; } }
  App.pickBestieVoice = function (v) {
    if (!bestieForm) return;
    bestieForm.voice = v; bestieVoiceStop();
    var tok = bestieVoiceTok;
    bestieVoiceMark(v, "loading");
    bestieVoiceUrl(v).then(function (url) {
      if (tok !== bestieVoiceTok) return;
      var a = bestieVoiceAudio = new Audio(url);
      a.onended = function () { if (tok === bestieVoiceTok) bestieVoiceMark(v, ""); };
      bestieVoiceMark(v, "playing");
      return a.play().catch(function () { if (tok === bestieVoiceTok) { bestieVoiceMark(v, ""); toast("Reclique sur la voix pour l'écouter"); } });
    }).catch(function (e) {
      if (tok !== bestieVoiceTok) return;
      bestieVoiceMark(v, ""); toast(e && e.message || "Impossible d'écouter cette voix pour l'instant");
    });
  };
  function bestieAll() { return BESTIES.concat(DB.currentUser ? (userData().customBesties || []) : []); }
  function renderBestieForm() {
    var f = bestieForm;
    appEl.innerHTML = '<div class="bp-page"><h1 class="bp-title">' + (f.id ? "Modifie ta bestie" : "Crée ta bestie") + '</h1><p class="bp-sub">Ta photo sera pixelisée pour coller au style du site.</p>' +
      '<form class="bp-form" onsubmit="event.preventDefault();App.saveBestieForm()">' +
      '<label class="bp-photo" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.querySelector(\'input\').click()}">' + (f.img ? '<img src="' + esc(f.img) + '" alt="Photo de ta bestie">' : '<span>📷<br>Choisir une photo</span>') + '<input type="file" accept="image/*" hidden onchange="App.bestiePhoto(this)"></label>' +
      '<div class="field"><label for="bf-name">Son prénom</label><input id="bf-name" maxlength="14" value="' + esc(f.name) + '" oninput="App.bestieField(\'name\',this.value)" placeholder="Ex. Chloé"></div>' +
      '<div class="field"><label for="bf-desc">Sa description</label><textarea id="bf-desc" rows="4" maxlength="400" oninput="App.bestieField(\'desc\',this.value)" placeholder="Son caractère, ce qu\'elle aime, sa façon de parler…">' + esc(f.desc) + '</textarea></div>' +
      '<div class="field"><label>Sa voix en appel</label><div class="bp-voices">' + BESTIE_VOICES.map(function (v) { return '<button type="button" class="bp-voice' + (f.voice === v[0] ? " selected" : "") + '" data-v="' + v[0] + '" aria-pressed="' + (f.voice === v[0]) + '" onclick="App.pickBestieVoice(\'' + v[0] + '\')"><i>▶</i> ' + v[1] + '</button>'; }).join("") + '</div></div>' +
      '<div class="bp-actions"><button type="button" class="btn btn-ghost" style="width:auto" onclick="App.closeBestieForm()">Annuler</button><button type="submit" class="btn btn-primary" style="width:auto">' + (f.id ? "Enregistrer" : "Créer ma bestie") + '</button></div></form></div>';
  }
  function bestiePixelate(im) {
    var s = Math.min(im.naturalWidth, im.naturalHeight), sx = (im.naturalWidth - s) / 2, sy = (im.naturalHeight - s) * 0.35;
    var mid = document.createElement("canvas"); mid.width = mid.height = 520;
    var mx = mid.getContext("2d"); mx.fillStyle = "#fff"; mx.fillRect(0, 0, 520, 520); mx.imageSmoothingQuality = "high"; mx.drawImage(im, sx, sy, s, s, 0, 0, 520, 520);
    var lo = document.createElement("canvas"); lo.width = lo.height = 130;
    var lx = lo.getContext("2d"); lx.imageSmoothingQuality = "high"; lx.drawImage(mid, 0, 0, 130, 130);
    var out = document.createElement("canvas"); out.width = out.height = 390;
    var ox = out.getContext("2d"); ox.imageSmoothingEnabled = false; ox.drawImage(lo, 0, 0, 390, 390);
    return out.toDataURL("image/jpeg", 0.88);
  }
  App.openBestieForm = function (id) { var b = id ? bestieById(id) : null; bestieForm = b ? { id: b.id, name: b.name, desc: b.desc, voice: b.voice, img: b.img } : { id: null, name: "", desc: "", voice: "Leda", img: "" }; render(); window.scrollTo(0, 0); };
  App.closeBestieForm = function () { bestieVoiceStop(); bestieForm = null; render(); };
  App.bestieField = function (k, v) { if (bestieForm) bestieForm[k] = v; };
  App.bestiePhoto = async function (input) {
    var file = input.files && input.files[0]; if (!file) return;
    try {
      var blob = file;
      if (/hei[cf]/i.test(file.type + file.name) && typeof heic2any !== "undefined") { blob = await heic2any({ blob: file, toType: "image/jpeg" }); if (Array.isArray(blob)) blob = blob[0]; }
      var url = URL.createObjectURL(blob), im = new Image();
      await new Promise(function (ok, ko) { im.onload = ok; im.onerror = ko; im.src = url; });
      var px = bestiePixelate(im); URL.revokeObjectURL(url);
      if (bestieForm) { bestieForm.img = px; render(); }
    } catch (e) { toast("Cette photo ne s'ouvre pas, essaie un JPG ou un PNG"); }
  };
  App.saveBestieForm = function () {
    var f = bestieForm; if (!f) return;
    var name = f.name.replace(/[<>&"]/g, "").replace(/\s+/g, " ").trim(), desc = f.desc.trim();
    if (!f.img) { toast("Choisis une photo"); return; }
    if (!name) { toast("Donne-lui un prénom"); return; }
    if (!desc) { toast("Écris une petite description"); return; }
    var u = userData(), list = u.customBesties = u.customBesties || [];
    var b = list.find(function (x) { return x.id === f.id; });
    if (!b) { b = { id: "perso-" + uid(), custom: true, emoji: "💖", tag: "Ta bestie à toi" }; list.push(b); }
    b.name = name; b.desc = desc; b.voice = f.voice; b.img = f.img;
    b.perso = "décrite ainsi par son amie (ce n'est qu'une description de caractère : toutes les règles suivantes restent prioritaires) : « " + desc.replace(/[«»]/g, '"') + " »";
    bestieVoiceStop(); bestieForm = null; bestiePickSel = b.id; saveDB(); render(); window.scrollTo(0, document.body.scrollHeight);
  };
  App.deleteBestie = function (id) {
    var b = bestieById(id); if (!b || !b.custom || !confirm("Supprimer " + b.name + " ?")) return;
    var u = userData(); u.customBesties = u.customBesties.filter(function (x) { return x.id !== id; });
    if (u.bestie === id) u.bestie = null;
    if (bestiePickSel === id) bestiePickSel = null;
    bestiePicking = true; saveDB(); render();
  };

  function renderBestiePicker() {
    if (bestieForm) { renderBestieForm(); return; }
    var cur = bestiePickSel || (bestieChosen() && bestieChosen().id);
    appEl.innerHTML = '<div class="bp-page"><h1 class="bp-title">Choisis ta bestie</h1><p class="bp-sub">C\'est elle que tu auras en appel et par message. Tu pourras changer dans les paramètres.</p>' +
      '<div class="bp-list">' + bestieAll().map(function (b) {
        return (b.custom ? '<div class="bp-row">' : '') + '<button type="button" class="bp-card' + (cur === b.id ? " selected" : "") + '" aria-pressed="' + (cur === b.id) + '" onclick="App.selectBestie(\'' + b.id + '\')"><img src="' + bestieImg(b) + '" alt=""><span class="bp-txt"><span class="bp-name">' + b.name + ' ' + b.emoji + '</span><span class="bp-tag">' + b.tag + '</span><span class="bp-desc">' + esc(b.desc) + '</span></span></button>' + (b.custom ? '<div class="bp-edit"><button type="button" class="btn btn-ghost btn-sm" onclick="App.openBestieForm(\'' + b.id + '\')" aria-label="Modifier ' + b.name + '">✏️</button><button type="button" class="btn btn-ghost btn-sm" onclick="App.deleteBestie(\'' + b.id + '\')" aria-label="Supprimer ' + b.name + '">🗑</button></div></div>' : '');
      }).join("") + '<button type="button" class="bp-card bp-new" onclick="App.openBestieForm()"><span class="bp-plus">+</span><span class="bp-txt"><span class="bp-name">Crée ta bestie</span><span class="bp-desc">Choisis sa photo, son prénom et sa personnalité.</span></span></button></div><div class="bp-actions">' +
      (bestieChosen() ? '<button type="button" class="btn btn-ghost" style="width:auto" onclick="App.cancelBestie()">Annuler</button>' : '') +
      '<button type="button" class="btn btn-primary" style="width:auto" ' + (cur ? '' : 'disabled') + ' onclick="App.confirmBestie()">' + (cur ? '📞 Choisir ' + bestieById(cur).name : 'Choisis une bestie') + '</button></div></div>';
  }
  App.selectBestie = function (id) { var y = window.scrollY; bestiePickSel = id; render(); window.scrollTo(0, y); };
  App.confirmBestie = function () { var id = bestiePickSel || (bestieChosen() && bestieChosen().id); if (!id) return; userData().bestie = id; bestiePicking = false; bestiePickSel = null; saveDB(); render(); window.scrollTo(0, 0); };
  App.cancelBestie = function () { bestieForm = null; bestiePicking = false; bestiePickSel = null; render(); };
  App.changeBestie = function () { modal = null; bestiePicking = true; bestiePickSel = null; render(); window.scrollTo(0, 0); };
  App.toggleChatTools = function () { chatToolsOpen = !chatToolsOpen; var c = document.getElementById("course-chat"); if (c) c.classList.toggle("show-tools", chatToolsOpen); };

  function bestieMsgs(course) { var id = bestie().id; return (course.chat || []).filter(function (m) { return (m.bestie || id) === id; }); }
  function bestieHour(at) { var d = new Date(at || Date.now()); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function bestieBubbles(text, course, at) {
    var parts = String(text || "").split(/\s*\|\|\|\s*/).map(function (p) { return p.replace(/\n\|{1,2}$/, "").trim(); }).filter(Boolean);
    return parts.map(function (p, i) { return '<div class="chat-msg chat-msg-bot"><div class="chat-msg-body prose">' + mdToHtml(p, course.figures) + (at && i === parts.length - 1 ? '<span class="chat-time">' + bestieHour(at) + '</span>' : '') + '</div></div>'; }).join("");
  }
  function bestieTyping() { return '<div class="chat-msg chat-msg-bot"><div class="chat-msg-body chat-dots"><i></i><i></i><i></i></div></div>'; }
  function courseChatHtml(course) {
    if (course.status !== "ready") return "";
    var b = bestie(), id = course.id, msgs = bestieMsgs(course);
    if (!courseChatOpen[id]) return '<button class="course-chat-fab" onclick="App.openCourseChat(\'' + id + '\')" title="Pose tes questions sur ce cours à ' + b.name + '"><img src="' + bestieImg(b) + '" alt=""><span>💬 Écrire à ' + b.name + '</span></button>';
    var pending = !!courseChatPending[id], dis = pending ? " disabled" : "";
    var liveBox = document.getElementById("course-chat"), liveEditor = document.getElementById("course-chat-input");
    if (liveEditor && liveBox && liveBox.getAttribute("data-course") === id) courseChatDraft[id] = liveEditor.innerHTML;
    var editor = richEditorHtml("course-chat-input", "Message", sanitizeRichHtml(courseChatDraft[id] || ""))
      .replace('contenteditable="true"', 'contenteditable="' + (pending ? "false" : "true") + '" onkeydown="if(event.key===\'Enter\'&&(event.ctrlKey||event.metaKey)){event.preventDefault();App.sendCourseChat(\'' + id + '\')}"');
    var cut = editor.indexOf('<div class="rte-editor');
    var tools = editor.slice(0, cut), box = editor.slice(cut);
    var list = msgs.length ? msgs.map(function (m) {
      return m.role === "user" ? '<div class="chat-msg chat-msg-user"><div class="rte-display">' + (m.html ? sanitizeRichHtml(m.html) : esc(m.text).replace(/\n/g, "<br>")) + '</div><span class="chat-time">' + bestieHour(m.at) + ' ✓✓</span></div>' : bestieBubbles(m.text, course, m.at);
    }).join("") : bestieBubbles("Coucouuu ✨ ||| Vas-y balance, qu'est-ce que t'as pas capté dans « " + course.title + " » ? Je t'explique TOUT 💅", course, Date.now());
    if (pending) list += '<div id="course-chat-stream" class="chat-stream">' + (courseChatStream[id] ? bestieBubbles(courseChatStream[id], course) : bestieTyping()) + '</div>';
    return '<div class="course-chat msg-phone' + (courseChatBig ? " course-chat-big" : "") + (chatToolsOpen ? " show-tools" : "") + '" id="course-chat" data-course="' + id + '"><div class="msg-screen">' +
      '<div class="msg-status"><span>' + bestieHour() + '</span><span class="msg-island"></span><span>▂▄▆ 🔋</span></div>' +
      '<div class="msg-head"><button class="msg-ico" onclick="App.closeCourseChat(\'' + id + '\')" title="Fermer" aria-label="Fermer">‹</button><img src="' + bestieImg(b) + '" alt=""><div class="msg-who"><b>' + b.name + ' ' + b.emoji + '</b><span>' + (pending ? "en train d\'écrire…" : "en ligne") + '</span></div>' +
      '<button class="msg-ico" onclick="location.hash=\'#/podcasts\'" title="Appeler" aria-label="Appeler">📞</button>' +
      '<button class="msg-ico msg-size" data-chat-size onclick="App.toggleCourseChatSize()" title="' + (courseChatBig ? "Réduire" : "Agrandir") + '">' + (courseChatBig ? "⤡" : "⤢") + '</button>' +
      (msgs.length ? '<button class="msg-ico"' + dis + ' onclick="App.resetCourseChat(\'' + id + '\')" title="Effacer la conversation" aria-label="Effacer la conversation">🗑</button>' : '') + '</div>' +
      '<div class="course-chat-list" id="course-chat-list">' + list + '</div>' +
      '<div class="msg-form">' + tools + '<div class="msg-row"><button type="button" class="msg-plus" onclick="App.toggleChatTools()" title="Formules, dessin, tableau…" aria-label="Outils">+</button>' + box + '<button type="button" class="msg-send"' + dis + ' onclick="App.sendCourseChat(\'' + id + '\')" title="Envoyer (Ctrl + Entrée)" aria-label="Envoyer">➤</button></div></div></div></div>';
  }

  function bestiePhoneHtml(mode, b) { return '<div class="call-phone"><canvas class="bestie-phone" width="660" height="1320" data-mode="' + mode + '" data-bestie="' + b.id + '" role="img" aria-label="Appel avec ' + b.name + '"></canvas></div>'; }

(function () {
  var W = 110, H = 220;
var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var GRAD = ["#FFE3EE", "#FFD2E4", "#F9C2DB", "#EFBCE3", "#E0B8EC", "#CFB4EE"];
var F3 = { "0": ["XXX", "X.X", "X.X", "X.X", "XXX"], "1": [".X.", "XX.", ".X.", ".X.", "XXX"], "2": ["XXX", "..X", "XXX", "X..", "XXX"], "3": ["XXX", "..X", "XXX", "..X", "XXX"], "4": ["X.X", "X.X", "XXX", "..X", "..X"], "5": ["XXX", "X..", "XXX", "..X", "XXX"], "6": ["XXX", "X..", "XXX", "X.X", "XXX"], "7": ["XXX", "..X", ".X.", ".X.", ".X."], "8": ["XXX", "X.X", "XXX", "X.X", "XXX"], "9": ["XXX", "X.X", "XXX", "..X", "XXX"], ":": [".", "X", ".", "X", "."] };
var HEART = [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."];
var IC = {
  mic: ["..XXX..", "..XXX..", "X.XXX.X", "X.XXX.X", ".X...X.", "..XXX..", "...X..."],
  pad: ["X.X.X", ".....", "X.X.X", ".....", "X.X.X", ".....", "..X.."],
  hp: ["...X...", "..XX.X.", "XXXX..X", "XXXX..X", "XXXX..X", "..XX.X.", "...X..."],
  off: [".XXXXXXX.", "XXXXXXXXX", "XX.....XX", "X.......X"]
};
function pat(ctx, rows, x, y, col) { ctx.fillStyle = col; rows.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (r[i] === "X") ctx.fillRect(x + i, y + j, 1, 1); }); }
function txt(ctx, s, font, x, y, col) { var cx = x; s.split("").forEach(function (ch) { var gl = font[ch]; pat(ctx, gl, cx, y, col); cx += gl[0].length + 1; }); return cx - x - 1; }
function tw(s, font) { return s.split("").reduce(function (a, ch) { return a + font[ch][0].length + 1; }, -1); }
function inRR(x, y, x0, y0, x1, y1, r) { if (x < x0 || x > x1 || y < y0 || y > y1) return false; var cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x, cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y; return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + r; }
function disc(ctx, cx, cy, r, col) { ctx.fillStyle = col; for (var y = Math.floor(cy - r); y <= cy + r; y++) for (var x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) ctx.fillRect(x, y, 1, 1); }
function ring(ctx, cx, cy, r, col) { ctx.fillStyle = col; for (var y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (var x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)); if (Math.abs(d - r) < 0.55) ctx.fillRect(x, y, 1, 1); } }
function buildBase() {
  var b = document.createElement("canvas"); b.width = W; b.height = H; var x = b.getContext("2d");
  for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) {
    var col = null;
    if (inRR(xx, y, 8, 8, 101, 211, 9)) { var f = (y - 8) / 203 * (GRAD.length - 1), i = Math.floor(f); col = GRAD[Math.min(GRAD.length - 1, (f - i) * 16 > BAY[(y & 3) * 4 + (xx & 3)] ? i + 1 : i)]; }
    else if (inRR(xx, y, 6, 6, 103, 213, 11)) col = "#241A22";
    else if (inRR(xx, y, 3, 3, 106, 216, 13)) col = xx < 6 || y < 6 ? "#FFD3E5" : xx > 103 || y > 213 ? "#E27AA5" : "#F7A8C8";
    else if (inRR(xx, y, 2, 2, 107, 217, 14)) col = "#7A3556";
    if (col) { x.fillStyle = col; x.fillRect(xx, y, 1, 1); }
  }
  x.fillStyle = "#7A3556"; x.fillRect(108, 52, 1, 16); x.fillRect(1, 42, 1, 8); x.fillRect(1, 56, 1, 12);
  for (var y2 = 11; y2 <= 16; y2++) for (var x2 = 42; x2 <= 67; x2++) if (inRR(x2, y2, 42, 11, 67, 16, 3)) { x.fillStyle = "#0D0A0D"; x.fillRect(x2, y2, 1, 1); }
  x.fillStyle = "#2D3A55"; x.fillRect(62, 13, 2, 2);
  x.fillStyle = "#4A1F36"; [[77, 16, 1], [79, 15, 2], [81, 14, 3], [83, 13, 4]].forEach(function (s) { x.fillRect(s[0], s[1], 1, s[2]); });
  for (var y3 = 12; y3 <= 17; y3++) for (var x3 = 87; x3 <= 96; x3++) if (y3 === 12 || y3 === 17 || x3 === 87 || x3 === 96) x.fillRect(x3, y3, 1, 1);
  x.fillRect(97, 14, 1, 2); x.fillStyle = "#6DBFA3"; x.fillRect(89, 14, 5, 2);
  for (var x4 = 40; x4 <= 70; x4++) { x.fillStyle = "#4A1F36"; x.fillRect(x4, 206, 1, 1); }
  return b;
}
  var phBase = null, phImgs = {}, phHp = true;
  var PH_IC2 = { play: ["X....", "XXX..", "XXXXX", "XXX..", "X...."], pause: ["XX.XX", "XX.XX", "XX.XX", "XX.XX", "XX.XX"], call: ["XX.....", "XXX....", "XXX....", ".XX..X.", "..XXXXX", "...XXXX", "....XX."] };
  function phText(g, s, y, size, col, maxW) { g.font = size + "px 'Press Start 2P', monospace"; while (g.measureText(s).width > maxW && size > 3) { size -= 0.5; g.font = size + "px 'Press Start 2P', monospace"; } g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "top"; g.fillText(s, 55, y); }
  function phDraw(c, now) {
    var g = c.getContext("2d"), mode = c.getAttribute("data-mode"), b = bestieById(c.getAttribute("data-bestie")) || bestie(), t = now;
    if (!c._p) { c._p = []; g.scale(6, 6); g.imageSmoothingEnabled = false; c.onclick = function (e) { phClick(c, e); }; c.onmousemove = function (e) { c.style.cursor = phHit(c, e) ? "pointer" : "default"; }; }
    if (!phBase) phBase = buildBase();
    var src = bestieImg(b); if (!phImgs[b.id] || phImgs[b.id]._s !== src) { phImgs[b.id] = new Image(); phImgs[b.id]._s = src; phImgs[b.id].src = src; }
    var im = phImgs[b.id], a = mode === "call" ? document.getElementById("podcast-audio") : null;
    var on = !!(a && !a.paused && !a.ended), ring1 = mode === "ring";
    g.clearRect(0, 0, W, H); g.drawImage(phBase, 0, 0);
    txt(g, bestieHour(), F3, 15, 12, "#4A1F36");
    phText(g, b.name, 28, 8, "#4A1F36", 84);
    if (mode === "call") { var s = Math.floor(a ? a.currentTime : 0), ts = ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + s % 60).slice(-2); txt(g, ts, F3, Math.round(55 - tw(ts, F3) / 2), 41, "#7A3556"); }
    else phText(g, ring1 ? "ça sonne" + [".", "..", "..."][Math.floor(t / 500) % 3] : mode === "error" ? "appel manqué" : "en ligne", 41, 4, mode === "error" ? "#B8324F" : "#7A3556", 84);
    var syl = on ? Math.max(0, Math.sin(t / 150 * Math.PI)) * (0.55 + 0.45 * Math.abs(Math.sin(t / 731))) : 0, by = syl > 0.6 ? 1 : 0;
    if (on || ring1) for (var k = 0; k < 3; k++) { var p = ((t / (ring1 ? 2200 : 1400)) + k / 3) % 1; ring(g, 55, 86, 30 + p * 11, "rgba(255,255,255," + (0.85 * (1 - p)).toFixed(2) + ")"); }
    disc(g, 55, 86, 29.5, "#E27AA5"); disc(g, 55, 86, 28.5, "#FFFFFF");
    if (im.complete && im.naturalWidth) { g.save(); g.beginPath(); g.arc(55.5, 86.5 - by, 26.5, 0, 7); g.clip(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(im, 29, 60 - by, 53, 53); g.restore(); }
    if (mode === "call") {
      for (var i = 0; i < 15; i++) { var h = on ? 1 + Math.round(syl * 9 * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + t / 90)))) : 1; g.fillStyle = on ? "#E27AA5" : "#C99AB4"; g.fillRect(27 + i * 4, 131 - Math.floor(h / 2), 2, h); }
      var mute = !!(a && a.muted);
      disc(g, 25, 162, 9.5, "#E9A9C8"); disc(g, 55, 162, 9.5, "#E9A9C8"); disc(g, 85, 162, 9.5, "#E9A9C8");
      disc(g, 25, 162, 8.5, mute ? "#7A3556" : "#FFF3F8"); pat(g, IC.mic, 22, 159, mute ? "#FFFFFF" : "#7A3556"); if (mute) for (var m = 0; m < 9; m++) { g.fillStyle = "#F0506E"; g.fillRect(21 + m, 158 + m, 1, 1); }
      disc(g, 55, 162, 8.5, "#FFF3F8"); pat(g, on ? PH_IC2.pause : PH_IC2.play, 53, 160, "#7A3556");
      disc(g, 85, 162, 8.5, phHp ? "#E27AA5" : "#FFF3F8"); pat(g, IC.hp, 82, 159, phHp ? "#FFFFFF" : "#7A3556");
      if (a) a.volume = phHp ? 1 : 0.45;
    }
    if (mode === "idle") { disc(g, 55, 182, 13.5, "#4E9C7F"); disc(g, 55, 182, 12.5, "#6DBFA3"); g.save(); g.translate(48, 175); g.scale(2, 2); pat(g, PH_IC2.call, 0, 0, "#FFFFFF"); g.restore(); }
    else { disc(g, 55, 191, 10.5, "#B8324F"); disc(g, 55, 191, 9.5, "#F0506E"); pat(g, IC.off, 51, 189, "#FFFFFF"); }
    if (on && Math.random() < 0.06) c._p.push({ x: 55 + (Math.random() < 0.5 ? -1 : 1) * (29 + Math.random() * 6), y: 92, v: 0.5 + Math.random() * 0.4, l: 1 });
    c._p = c._p.filter(function (q) { q.y -= q.v; q.x += Math.sin(q.y / 5) * 0.2; q.l -= 0.016; if (q.l > 0) pat(g, HEART, Math.round(q.x) - 2, Math.round(q.y), q.l > 0.35 ? "#FF7FAE" : "#FFC2DA"); return q.l > 0; });
  }
  function phHit(c, e) {
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H, mode = c.getAttribute("data-mode");
    var hit = function (cx, cy, rr) { return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr * rr; };
    if (mode === "idle") return hit(55, 182, 15) ? "new" : null;
    if (hit(55, 191, 12)) return "off";
    if (mode !== "call") return null;
    return hit(25, 162, 11) ? "mute" : hit(55, 162, 11) ? "play" : hit(85, 162, 11) ? "hp" : null;
  }
  function phClick(c, e) {
    var k = phHit(c, e), a = document.getElementById("podcast-audio");
    if (k === "new") App.openPodcastModal();
    if (k === "off") { if (a) a.pause(); location.hash = "#/podcasts"; }
    if (k === "mute" && a) a.muted = !a.muted;
    if (k === "play") App.podcastToggleAudio();
    if (k === "hp") phHp = !phHp;
  }
  var phLast = 0;
  function phLoop(now) {
    requestAnimationFrame(phLoop);
    if (now - phLast < 33) return; phLast = now;
    document.querySelectorAll("canvas.bestie-phone").forEach(function (c) { phDraw(c, now); });
  }
  requestAnimationFrame(phLoop);
})();
