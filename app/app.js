// Feelascope Right Now – small offline-friendly web app.
(function () {
  var C = window.FS_CONFIG || {};
  var view = document.getElementById("view");
  var DATA = null;

  // ---- storage (can fail in private mode) ----
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function isMember() { return get("fs_member") === "1"; }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function open(m) { return m.free || isMember(); }
  function find(id) { return DATA.moments.filter(function (m) { return m.id === id; })[0]; }

  function pill() {
    var p = document.getElementById("memberPill");
    if (isMember()) { p.textContent = "Member ✓"; p.className = "pill member"; p.href = "#/unlock"; }
  }

  // ---- views ----
  function home() {
    var h = '<div class="intro"><div class="kicker">For parents of kids 3–8</div>' +
      '<h1>What happened just now?</h1>' +
      '<p>Pick the moment. See what your child is feeling, get three things you can say right now, and a Mia story to read together tonight.</p></div><div class="list">';
    DATA.moments.forEach(function (m) {
      h += '<a class="card" href="#/m/' + m.id + '"><img src="img/' + esc(m.img) + '" alt="" loading="lazy" width="118" height="74">' +
        '<div><span class="tag">' + esc(m.tag) + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.sub) + '</p></div>' +
        (m.free ? '<span class="lock free">Free</span>' : (isMember() ? "" : '<span class="lock">🔒</span>')) + '</a>';
    });
    h += '</div>';
    if (!standalone()) h += '<div class="install"><b>Keep it one tap away:</b> on iPhone tap Share → <i>Add to Home Screen</i>. On Android tap ⋮ → <i>Install app</i>.</div>';
    view.innerHTML = h;
  }

  function moment(id) {
    var m = find(id);
    if (!m) return home();
    if (!open(m)) return wall(m);
    var h = '<a class="back" href="#/">← All moments</a>' +
      '<div class="hero"><img src="img/' + esc(m.img) + '" alt="" width="1600" height="900"></div>' +
      '<span class="tag">' + esc(m.tag) + '</span><h1>' + esc(m.title) + '</h1><p class="sub">' + esc(m.sub) + '</p>' +
      '<div class="box feel"><h2>👀 What your child feels</h2><p>"' + esc(m.feel) + '"</p></div>' +
      '<div class="box say"><h2>💬 Say this, right now</h2><ol>' + m.say.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ol></div>' +
      '<div class="box avoid"><h2>✋ Try to avoid</h2><p>' + esc(m.avoid) + '</p></div>' +
      '<div class="box why"><h2>💡 Why this works</h2><p>' + esc(m.why) + '</p></div>' +
      '<div class="tonight"><div class="kicker" style="color:var(--sun)">Tonight at bedtime</div><h2>' + esc(m.tonight.title) + '</h2>' +
      '<p>A short Mia story about this exact moment. Read it together tonight, so your child can feel it again, safely, from the outside.</p>' +
      '<a class="btn" href="#/s/' + m.id + '">Read tonight\'s story</a></div>';
    view.innerHTML = h;
    window.scrollTo(0, 0);
  }

  function story(id) {
    var m = find(id);
    if (!m) return home();
    if (!open(m)) return wall(m);
    var size = parseInt(get("fs_size") || "21", 10);
    var paras = (m.tonight.text.match(/[^.!?]+[.!?]+"?\s*/g) || [m.tonight.text]).map(function (x) { return x.trim(); });
    // group sentences into short paragraphs of ~3 sentences for easy reading aloud
    var groups = [], cur = [];
    paras.forEach(function (s) { cur.push(s); var q = (cur.join(" ").match(/"/g) || []).length; if (cur.length >= 3 && q % 2 === 0) { groups.push(cur.join(" ")); cur = []; } });
    if (cur.length) groups.push(cur.join(" "));
    view.innerHTML = '<div class="story"><a class="back" href="#/m/' + m.id + '">← Back</a><div class="kicker" style="color:#aab3cc">A Feelascope bedtime story</div>' +
      '<h1>' + esc(m.tonight.title) + '</h1><div class="size"><button data-d="-2">A−</button><button data-d="2">A+</button></div>' +
      '<div id="txt" style="font-size:' + size + 'px">' + groups.map(function (g) { return '<p style="font-size:inherit">' + esc(g) + '</p>'; }).join("") + '</div>' +
      '<p style="font-size:16px;color:#aab3cc">The end. Ask softly: <i>"Did Mia ever feel like you did today?"</i></p></div>';
    view.querySelectorAll(".size button").forEach(function (b) {
      b.onclick = function () { size = Math.max(16, Math.min(30, size + parseInt(b.dataset.d, 10))); set("fs_size", size); document.getElementById("txt").style.fontSize = size + "px"; };
    });
    window.scrollTo(0, 0);
  }

  function benefits() {
    var n = DATA.moments.length;
    return '<ul><li>All ' + n + ' moments, with new ones added every month</li><li>What your child feels, in their own words</li>' +
      '<li>Three sentences to say right now</li><li>A Mia bedtime story for every moment</li><li>Works offline, right from your home screen</li></ul>';
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
      h += '<h2>The full library opens soon</h2><p>The first three moments are free right now. Join the early-access list and you\'ll be first in, with a founding-member discount.</p>' + benefits() +
        '<form id="wl"><input type="hidden" name="referrer" value="https://feelascope-coder.github.io/app/#waitlist">' +
        '<input type="email" name="email_address" required placeholder="Your email" autocomplete="email" aria-label="Your email">' +
        '<button class="btn wide" type="submit">Get early access</button></form>' +
        '<p class="fine">You\'ll also get our free guide and the weekly Feelascope email. Unsubscribe anytime. See our <a href="../privacy.html">privacy policy</a>.</p>';
    }
    h += '</div>';
    view.innerHTML = h;
    bindWaitlist(); bindKey();
    window.scrollTo(0, 0);
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
  // re-check membership now and then, so cancelled keys lock again
  function recheck() {
    var key = get("fs_key"), last = parseInt(get("fs_checked") || "0", 10);
    if (!key || !C.provider || Date.now() - last < 3 * 864e5 || !navigator.onLine) return;
    validate(key).then(function (ok) { set("fs_checked", String(Date.now())); if (!ok) { set("fs_member", "0"); } }).catch(function () {});
  }

  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone; }

  // ---- router ----
  function route() {
    var h = location.hash.replace(/^#\/?/, "").split("/");
    if (h[0] === "m") moment(h[1]);
    else if (h[0] === "s") story(h[1]);
    else if (h[0] === "unlock") unlockPage();
    else home();
  }

  fetch("moments.json").then(function (r) { return r.json(); }).then(function (d) {
    DATA = d; pill(); route(); recheck();
    window.addEventListener("hashchange", route);
  }).catch(function () { view.innerHTML = "<p>Couldn't load the moments. Please check your connection and reload.</p>"; });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();
