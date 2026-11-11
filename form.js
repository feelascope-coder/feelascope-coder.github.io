// Nieuwsbriefformulier (Kit, formulier "Free guide – Through Your Child's Eyes").
// Verstuurt via fetch, zodat er nooit een e-mailadres in een URL terechtkomt; daarna naar thanks.html.
var KIT_FORM_ID = "10176899";
document.querySelectorAll("form.kit").forEach(function (f) {
  var btn = f.querySelector("button");
  if (!KIT_FORM_ID) {
    btn.disabled = true; btn.textContent = "Opening very soon";
    f.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
    return;
  }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var oud = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    fetch("https://app.kit.com/forms/" + KIT_FORM_ID + "/subscriptions", {
      method: "POST", body: new FormData(f), headers: { "Accept": "application/json" }
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && (!res.j.status || res.j.status === "success")) { window.location.href = "thanks.html"; return; }
        throw new Error((res.j && res.j.errors && res.j.errors.messages && res.j.errors.messages.join(" ")) || "error");
      })
      .catch(function (err) {
        btn.disabled = false; btn.textContent = oud;
        var m = f.querySelector(".fout") || f.appendChild(Object.assign(document.createElement("p"), { className: "fine fout" }));
        m.style.color = "#c0392b";
        m.textContent = "Something went wrong. Please check your email address and try again.";
      });
  });
});
