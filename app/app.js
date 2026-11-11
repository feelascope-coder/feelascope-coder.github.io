// Feelascope Right Now – small offline-friendly web app.
(function () {
  var C = window.FS_CONFIG || {};
  var view = document.getElementById("view");
  var DATA = null;

  // ---- storage (can fail in private mode) ----
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getJ(k) { try { return JSON.parse(get(k) || "{}") || {}; } catch (e) { return {}; } }
  function setJ(k, o) { set(k, JSON.stringify(o)); }
  function isMember() { return get("fs_member") === "1"; }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function open(m) { return m.free || isMember(); }
  function find(id) { return DATA.moments.filter(function (m) { return m.id === id; })[0]; }
  function buzz() { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} }
  function top() { window.scrollTo(0, 0); }

  function pill() {
    var p = document.getElementById("memberPill");
    if (isMember()) { p.textContent = "Member ✓"; p.className = "pill member"; p.href = "#/unlock"; }
  }

  // ---- finder: where are you? ----
  var PLACES = [
    { k: "school", e: "🏫", t: "School or pickup", ids: ["after-school", "drop-off"] },
    { k: "morning", e: "⏰", t: "Getting out the door", ids: ["morning-rush", "no-everything"] },
    { k: "home", e: "🏠", t: "At home", ids: ["tablet-off", "i-hate-you", "hitting", "no-everything"] },
    { k: "meal", e: "🍽️", t: "At the table", ids: ["dinner"] },
    { k: "bed", e: "🌙", t: "Bedtime", ids: ["bedtime-stall", "dark"] }
  ];

  // ---- feelings check-in for the child ----
  var FEELS = [
    { k: "happy", t: "Happy", mia: "Mia feels happy too, like sunshine in her tummy!", kid: "Do a happy dance! Wiggle your arms and your toes.", ids: [] },
    { k: "sad", t: "Sad", mia: "Mia feels sad sometimes too. It's okay to cry.", kid: "Ask for a big, long hug. Hugs help sad feelings get smaller.", ids: ["drop-off", "after-school"] },
    { k: "angry", t: "Mad", mia: "Mia gets mad too! Mad is allowed. Hitting isn't.", kid: "Stomp like an elephant 5 times. Then roar like a lion!", ids: ["hitting", "i-hate-you", "tablet-off"] },
    { k: "scared", t: "Scared", mia: "Mia gets scared too, especially in the dark.", kid: "Hold a grown-up's hand and breathe like a balloon with Mia.", ids: ["dark", "drop-off"] },
    { k: "tired", t: "Tired", mia: "Mia's batteries get tired too.", kid: "Snuggle up and charge your batteries with a quiet cuddle.", ids: ["morning-rush", "bedtime-stall"] },
    { k: "worried", t: "Worried", mia: "Mia worries sometimes too. Worries feel smaller when you say them out loud.", kid: "Whisper your worry to a grown-up. They can hold it with you.", ids: ["drop-off", "dark"] }
  ];

  // ---- views ----
  function progress() {
    var p = getJ("fs_practice"), t = getJ("fs_tried");
    return { practiced: Object.keys(p).length, helped: Object.keys(t).filter(function (k) { return t[k] === "helped"; }).length };
  }

  function home() {
    var pr = progress();
    var h = '<div class="intro"><div class="kicker">For parents of kids 3–8</div>' +
      '<h1>What happened just now?</h1>' +
      '<p>Tap where you are. We\'ll show you what your child feels and what to say.</p></div>' +
      '<div class="places">' + PLACES.map(function (p) {
        return '<a class="place" href="#/find/' + p.k + '"><span>' + p.e + '</span>' + esc(p.t) + '</a>';
      }).join("") + '</div>' +
      '<div class="tools">' +
      '<a class="tool calm" href="#/calm"><img src="img/face-happy.jpg" alt="" width="64" height="64"><div><b>Calm corner</b><span>Breathe with Mia, together with your child</span></div></a>' +
      '<a class="tool feels" href="#/feelings"><img src="img/face-worried.jpg" alt="" width="64" height="64"><div><b>How do you feel?</b><span>Let your child tap their feeling</span></div></a>' +
      '</div>';
    if (pr.practiced || pr.helped) {
      h += '<div class="streak">🏅 You practiced <b>' + pr.practiced + '</b> of ' + DATA.moments.length + ' moments' +
        (pr.helped ? ' · <b>' + pr.helped + '</b> already helped at home' : '') + '</div>';
    }
    h += '<h2 class="sec">All moments</h2><div class="list">' + DATA.moments.map(card).join("") + '</div>';
    if (!standalone()) h += '<div class="install"><b>Keep it one tap away:</b> on iPhone tap Share → <i>Add to Home Screen</i>. On Android tap ⋮ → <i>Install app</i>.</div>';
    view.innerHTML = h;
  }

  function card(m) {
    var p = getJ("fs_practice")[m.id], t = getJ("fs_tried")[m.id];
    var badge = m.free ? '<span class="lock free">Free</span>' : (isMember() ? "" : '<span class="lock">🔒</span>');
    if (t === "helped") badge = '<span class="lock done">💛 Helped</span>';
    else if (p) badge = '<span class="lock done">✓ Practiced</span>';
    return '<a class="card" href="#/m/' + m.id + '"><img src="img/' + esc(m.img) + '" alt="" loading="lazy" width="118" height="74">' +
      '<div><span class="tag">' + esc(m.tag) + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.sub) + '</p></div>' + badge + '</a>';
  }

  function finder(k) {
    var p = PLACES.filter(function (x) { return x.k === k; })[0];
    if (!p) return home();
    view.innerHTML = '<a class="back" href="#/">← Back</a><div class="kicker">' + p.e + ' ' + esc(p.t) + '</div>' +
      '<h1>What is your child doing?</h1><div class="choices">' + p.ids.map(function (id) {
        var m = find(id);
        return '<a class="choice" href="#/m/' + id + '"><img src="img/' + esc(m.img) + '" alt="" width="96" height="60"><span>' + esc(m.sub) + '</span></a>';
      }).join("") + '</div><p class="fine" style="margin-top:16px">Not listed? <a href="#/">See all moments</a> or try the <a href="#/calm">calm corner</a> together.</p>';
    top();
  }

  // stable shuffle per moment so the best answer isn't always in the same spot
  function order(m) {
    var n = m.practice.options.length, idx = [], seed = 0, i;
    for (i = 0; i < n; i++) idx.push(i);
    for (i = 0; i < m.id.length; i++) seed = (seed * 31 + m.id.charCodeAt(i)) % 9973;
    for (i = n - 1; i > 0; i--) { seed = (seed * 7919 + 13) % 9973; var j = seed % (i + 1), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return idx;
  }

  function moment(id) {
    var m = find(id);
    if (!m) return home();
    if (!open(m)) return wall(m);
    var tried = getJ("fs_tried")[m.id];
    var h = '<a class="back" href="#/">← All moments</a>' +
      '<div class="hero"><img src="img/' + esc(m.img) + '" alt="" width="1600" height="900"></div>' +
      '<span class="tag">' + esc(m.tag) + '</span><h1>' + esc(m.title) + '</h1><p class="sub">' + esc(m.sub) + '</p>' +
      '<button class="box feel reveal" id="rv" aria-expanded="false"><h2>👀 What is your child feeling?</h2><p class="hint">Tap to see it through their eyes</p>' +
      '<p class="hidden" id="rvt">"' + esc(m.feel) + '"</p></button>' +
      '<div class="box quiz"><h2>🎯 Quick practice: what would you say?</h2><p class="q">' + esc(m.practice.q) + '</p><div id="opts">' +
      order(m).map(function (i) { return '<button class="opt" data-i="' + i + '">' + esc(m.practice.options[i]) + '</button>'; }).join("") +
      '</div><p id="fb" class="fb"></p></div>' +
      '<div class="box say"><h2>💬 Say this, right now</h2><ol>' + m.say.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ol></div>' +
      '<div class="box avoid"><h2>✋ Try to avoid</h2><p>' + esc(m.avoid) + '</p></div>' +
      '<details class="box why"><summary><h2>💡 Why this works</h2></summary><p>' + esc(m.why) + '</p></details>' +
      '<div class="box tried"><h2>🏡 Did you try it?</h2><div class="row">' +
      [["helped", "😊 It helped"], ["some", "😐 A little"], ["not", "😣 Not this time"]].map(function (x) {
        return '<button class="mood' + (tried === x[0] ? " on" : "") + '" data-v="' + x[0] + '">' + x[1] + '</button>';
      }).join("") + '</div><p id="tr" class="fb">' + triedText(tried) + '</p></div>' +
      '<div class="tonight"><div class="kicker" style="color:var(--sun)">Tonight at bedtime</div><h2>' + esc(m.tonight.title) + '</h2>' +
      '<p>A short Mia story about this exact moment. Read it together, page by page, so your child can feel it again, safely, from the outside.</p>' +
      '<a class="btn" href="#/s/' + m.id + '">Read tonight\'s story</a></div>';
    view.innerHTML = h;

    var rv = document.getElementById("rv");
    rv.onclick = function () { buzz(); rv.classList.add("open"); rv.setAttribute("aria-expanded", "true"); document.getElementById("rvt").classList.remove("hidden"); var hi = rv.querySelector(".hint"); if (hi) hi.remove(); };

    view.querySelectorAll(".opt").forEach(function (b) {
      b.onclick = function () {
        buzz();
        var i = parseInt(b.dataset.i, 10), best = m.practice.best, fb = document.getElementById("fb");
        view.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("good", "bad"); });
        b.classList.add(i === best ? "good" : "bad");
        fb.className = "fb " + (i === best ? "ok" : "warn");
        fb.textContent = (i === best ? "Great choice! " : "Hmm, not quite. ") + m.practice.feedback[i];
        if (i === best) { var p = getJ("fs_practice"); p[m.id] = 1; setJ("fs_practice", p); }
      };
    });
    view.querySelectorAll(".mood").forEach(function (b) {
      b.onclick = function () {
        buzz();
        var t = getJ("fs_tried"); t[m.id] = b.dataset.v; setJ("fs_tried", t);
        view.querySelectorAll(".mood").forEach(function (o) { o.classList.toggle("on", o === b); });
        document.getElementById("tr").innerHTML = triedText(b.dataset.v);
      };
    });
    top();
  }

  function triedText(v) {
    if (v === "helped") return "That's wonderful. You saw the moment through their eyes. 💛";
    if (v === "some") return "A little is a real start. These moments get easier with practice.";
    if (v === "not") return 'That\'s normal. Hard moments don\'t change in one try. Tonight, try the bedtime story or the <a href="#/calm">calm corner</a> together.';
    return "";
  }

  function story(id) {
    var m = find(id);
    if (!m) return home();
    if (!open(m)) return wall(m);
    var size = parseInt(get("fs_size") || "22", 10);
    var sents = (m.tonight.text.match(/[^.!?]+[.!?]+"?\s*/g) || [m.tonight.text]).map(function (x) { return x.trim(); });
    var pages = [], cur = [];
    sents.forEach(function (s) { cur.push(s); var q = (cur.join(" ").match(/"/g) || []).length; if (cur.join(" ").length >= 170 && q % 2 === 0) { pages.push(cur.join(" ")); cur = []; } });
    if (cur.length) pages.push(cur.join(" "));
    var n = 0, total = pages.length + 1;

    function render() {
      var last = n === pages.length;
      var dots = ""; for (var i = 0; i < total; i++) dots += '<i class="' + (i === n ? "on" : "") + '"></i>';
      var body = last
        ? '<div class="end"><img src="img/face-happy.jpg" alt="" width="120" height="120"><h2>The end</h2>' +
          '<p>Ask softly:</p><p class="ask">"Did you ever feel like Mia?"</p><p class="ask">"What helped Mia feel better?"</p>' +
          '<a class="btn" href="#/calm">Breathe with Mia before sleep</a></div>'
        : '<p class="page" style="font-size:' + size + 'px">' + esc(pages[n]) + '</p>';
      view.innerHTML = '<div class="story"><div class="stop"><a class="back" href="#/m/' + m.id + '">← Back</a>' +
        '<div class="size"><button data-d="-2" aria-label="Smaller text">A−</button><button data-d="2" aria-label="Bigger text">A+</button></div></div>' +
        (n === 0 ? '<div class="kicker" style="color:#aab3cc">A Feelascope bedtime story</div><h1>' + esc(m.tonight.title) + '</h1>' : "") +
        '<div class="tap" id="tap">' + body + '</div>' +
        '<div class="nav2"><button id="prev" ' + (n === 0 ? "disabled" : "") + '>‹</button><div class="dots">' + dots + '</div><button id="next" ' + (last ? "disabled" : "") + '>›</button></div>' +
        (n === 0 ? '<p class="fine" style="color:#aab3cc;text-align:center">Tap the page to turn it</p>' : "") + '</div>';
      document.getElementById("prev").onclick = function () { if (n > 0) { n--; render(); } };
      document.getElementById("next").onclick = function () { if (n < pages.length) { n++; buzz(); render(); } };
      if (!last) document.getElementById("tap").onclick = function () { n++; buzz(); render(); };
      view.querySelectorAll(".size button").forEach(function (b) {
        b.onclick = function (e) { e.stopPropagation(); size = Math.max(16, Math.min(32, size + parseInt(b.dataset.d, 10))); set("fs_size", size); render(); };
      });
    }
    render(); top();
  }

  // ---- calm corner: balloon breathing ----
  var calmTimer = null;
  function calm() {
    view.innerHTML = '<a class="back" href="#/">← Back</a><div class="calmbox">' +
      '<div class="kicker">Calm corner · do it together</div><h1>Breathe like a balloon</h1>' +
      '<p class="sub">Sit close. Breathe in while the balloon grows, out while it shrinks. Five times, together with Mia.</p>' +
      '<div class="balloon" id="bal"><img src="img/face-happy.jpg" alt="Mia" width="180" height="180"></div>' +
      '<p class="cue" id="cue">Ready?</p><p class="count" id="cnt"></p>' +
      '<button class="btn wide" id="go">Start</button></div>';
    var bal = document.getElementById("bal"), cue = document.getElementById("cue"), cnt = document.getElementById("cnt"), go = document.getElementById("go");
    go.onclick = function () {
      go.style.display = "none"; var b = 0;
      function breath() {
        if (b === 5) {
          bal.className = "balloon"; cue.textContent = "You did it! 🎉"; cnt.textContent = "Notice how your body feels now.";
          go.style.display = ""; go.textContent = "Again"; return;
        }
        b++; cnt.textContent = "Breath " + b + " of 5";
        cue.textContent = "Smell the flower… breathe in 🌸"; bal.className = "balloon grow"; buzz();
        calmTimer = setTimeout(function () {
          cue.textContent = "Blow out the candle… breathe out 🕯️"; bal.className = "balloon shrink";
          calmTimer = setTimeout(breath, 5000);
        }, 4000);
      }
      breath();
    };
    top();
  }

  function feelings(k) {
    var f = FEELS.filter(function (x) { return x.k === k; })[0];
    if (!f) {
      view.innerHTML = '<a class="back" href="#/">← Back</a><div class="kicker">For your child</div><h1>How do you feel right now?</h1>' +
        '<p class="sub">Hand the phone to your child. They tap the Mia that looks like them.</p><div class="faces">' +
        FEELS.map(function (x) { return '<a class="face" href="#/feelings/' + x.k + '"><img src="img/face-' + x.k + '.jpg" alt="" width="180" height="180"><span>' + x.t + '</span></a>'; }).join("") + '</div>';
      top(); return;
    }
    buzz();
    var links = f.ids.map(function (id) { var m = find(id); return '<a href="#/m/' + id + '">' + esc(m.title) + '</a>'; }).join("<br>");
    view.innerHTML = '<a class="back" href="#/feelings">← Pick again</a><div class="feelcard">' +
      '<img src="img/face-' + f.k + '.jpg" alt="" width="220" height="220"><h1>' + f.t + '</h1>' +
      '<p class="big">' + esc(f.mia) + '</p><div class="box kid"><h2>Try this</h2><p>' + esc(f.kid) + '</p></div>' +
      (f.k !== "happy" ? '<a class="btn wide" href="#/calm">Breathe with Mia</a>' : "") + '</div>' +
      (links ? '<div class="box parent"><h2>For the grown-up</h2><p class="fine">Moments that often come with this feeling:</p><p>' + links + '</p></div>' : "");
    top();
  }

  function benefits() {
    var n = DATA.moments.length;
    return '<ul><li>All ' + n + ' moments, with new ones added every month</li><li>What your child feels, in their own words</li>' +
      '<li>Practice what to say, then three sentences for right now</li><li>A page-by-page Mia bedtime story for every moment</li><li>Calm corner and feelings check-in for your child</li></ul>';
  }

  function wall(m) {
    var h = '<a class="back" href="#/">← All moments</a><div class="wall">' +
      (m ? '<img src="img/' + esc(m.img) + '" alt="" style="border-radius:16px;margin-bottom:14px">' : "") +
      '<div class="kicker">' + (m ? esc(m.title) : "Feelascope Right Now") + '</div>';
    if (C.provider && C.checkout_yearly) {
      h += '<h2>Unlock every moment</h2>' + benefits() + '<div class="plans">' +
        '<a class="btn wide" href="' + esc(C.checkout_yearly) + '">' + (C.trial_days ? "Start " + C.trial_days + "-day free trial · " : "") + esc(C.price_yearly) + '</a>' +
        (C.checkout_monthly ? '<a class="btn ghost wide" href="' + esc(C.checkout_monthly) + '">Monthly · ' + esc(C.price_monthly) + '</a>' : "") +
        '</div><p class="fine">Cancel anytime. After checkout you\'ll get a license key by email. Enter it below to unlock.</p>' + keyForm();
    } else {
      h += '<h2>The full library opens soon</h2><p>The first three moments, the calm corner and the feelings check-in are free right now. Join the early-access list and you\'ll be first in, with a founding-member discount.</p>' + benefits() +
        '<form id="wl"><input type="hidden" name="referrer" value="https://feelascope-coder.github.io/app/#waitlist">' +
        '<input type="email" name="email_address" required placeholder="Your email" autocomplete="email" aria-label="Your email">' +
        '<button class="btn wide" type="submit">Get early access</button></form>' +
        '<p class="fine">You\'ll also get our free guide and the weekly Feelascope email. Unsubscribe anytime. See our <a href="../privacy.html">privacy policy</a>.</p>';
    }
    h += '</div>';
    view.innerHTML = h;
    bindWaitlist(); bindKey(); top();
  }

  function keyForm() {
    return '<form id="kf" style="margin-top:14px;text-align:left"><label class="fine" for="key">Already a member? Enter your license key</label>' +
      '<input id="key" type="text" name="key" required autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX"><button class="btn dark wide" type="submit">Unlock</button><p id="kmsg"></p></form>';
  }

  function unlockPage() {
    if (isMember()) {
      view.innerHTML = '<a class="back" href="#/">← All moments</a><div class="wall"><h2>You\'re a member 💛</h2><p>Every moment is unlocked on this device.</p>' +
        '<p class="fine">Manage or cancel your subscription from the link in your receipt email.</p><a class="btn" href="#/">Go to the moments</a></div>';
      return;
    }
    wall(null);
  }

  // ---- early access list (Kit) ----
  function bindWaitlist() {
    var f = document.getElementById("wl"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Sending…";
      fetch("https://app.kit.com/forms/" + C.kit_form_id + "/subscriptions", { method: "POST", body: new FormData(f), headers: { "Accept": "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("x"); set("fs_waitlist", "1");
          f.outerHTML = '<p class="ok">You\'re on the list! Check your inbox to confirm. 💌</p>'; })
        .catch(function () { btn.disabled = false; btn.textContent = "Get early access";
          f.insertAdjacentHTML("beforeend", '<p class="fout">Something went wrong. Please check your email and try again.</p>'); });
    });
  }

  // ---- license key unlock ----
  function validate(key) {
    if (C.provider === "polar") {
      return fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key, organization_id: C.polar_org_id })
      }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { return j && j.status === "granted"; });
    }
    if (C.provider === "lemonsqueezy") {
      var b = new URLSearchParams(); b.append("license_key", key);
      return fetch("https://api.lemonsqueezy.com/v1/licenses/validate", { method: "POST", headers: { "Accept": "application/json" }, body: b })
        .then(function (r) { return r.json(); }).then(function (j) { return !!(j && j.valid); });
    }
    return Promise.resolve(false);
  }
  function bindKey() {
    var f = document.getElementById("kf"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var key = document.getElementById("key").value.trim(), msg = document.getElementById("kmsg"), btn = f.querySelector("button");
      btn.disabled = true; btn.textContent = "Checking…";
      validate(key).then(function (ok) {
        if (ok) { set("fs_member", "1"); set("fs_key", key); pill(); location.hash = "#/"; route(); }
        else { msg.className = "fout"; msg.textContent = "That key didn't work. Copy it exactly from your receipt email."; btn.disabled = false; btn.textContent = "Unlock"; }
      }).catch(function () { msg.className = "fout"; msg.textContent = "Couldn't check right now. Are you online?"; btn.disabled = false; btn.textContent = "Unlock"; });
    });
  }
  function recheck() {
    var key = get("fs_key"), last = parseInt(get("fs_checked") || "0", 10);
    if (!key || !C.provider || Date.now() - last < 3 * 864e5 || !navigator.onLine) return;
    validate(key).then(function (ok) { set("fs_checked", String(Date.now())); if (!ok) { set("fs_member", "0"); } }).catch(function () {});
  }

  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone; }

  // ---- router ----
  function route() {
    if (calmTimer) { clearTimeout(calmTimer); calmTimer = null; }
    var h = location.hash.replace(/^#\/?/, "").split("/");
    if (h[0] === "m") moment(h[1]);
    else if (h[0] === "s") story(h[1]);
    else if (h[0] === "find") finder(h[1]);
    else if (h[0] === "calm") calm();
    else if (h[0] === "feelings") feelings(h[1]);
    else if (h[0] === "unlock") unlockPage();
    else home();
  }

  fetch("moments.json").then(function (r) { return r.json(); }).then(function (d) {
    DATA = d; pill(); route(); recheck();
    window.addEventListener("hashchange", route);
  }).catch(function () { view.innerHTML = "<p>Couldn't load the moments. Please check your connection and reload.</p>"; });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();
