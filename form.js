// Nieuwsbriefformulier (Kit). Zet hier het formulier-ID uit Kit; zolang het leeg is, staat het formulier uit.
var KIT_FORM_ID = "";
document.querySelectorAll("form.kit").forEach(function (f) {
  var btn = f.querySelector("button");
  if (!KIT_FORM_ID) {
    btn.disabled = true; btn.textContent = "Opening very soon";
    f.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
    return;
  }
  f.action = "https://app.kit.com/forms/" + KIT_FORM_ID + "/subscriptions";
  f.method = "post";
});
