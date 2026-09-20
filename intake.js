(function () {
  var form = document.getElementById("intake-form");
  var statusEl = document.getElementById("form-status");
  if (!form || !statusEl) return;

  var STORAGE_KEY = "discretion_intake_leads";

  function showStatus(message, ok) {
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = "form-status " + (ok ? "ok" : "err");
  }

  function saveLead(lead) {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.push(lead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = (document.getElementById("name").value || "").trim();
    var email = (document.getElementById("email").value || "").trim();
    var phone = (document.getElementById("phone").value || "").trim();
    var body = (document.getElementById("body").value || "").trim();
    var adultsOnly = document.getElementById("adults-only").checked;

    if (!name || !email || !body || !adultsOnly) {
      showStatus("Please complete all required fields and confirm adults-only.", false);
      return;
    }

    var lead = {
      name: name,
      email: email,
      phone: phone || null,
      body: body,
      adultsOnly: true,
      createdAt: new Date().toISOString(),
      source: "website",
    };

    try {
      saveLead(lead);
    } catch (e) {
      /* localStorage may be blocked; still offer mailto */
    }

    var lines = [
      "Discretion intake request",
      "",
      "Name: " + name,
      "Email: " + email,
      phone ? "Phone: " + phone : null,
      "",
      "Brief:",
      body,
      "",
      "Adults-only confirmed: yes",
      "Submitted: " + lead.createdAt,
    ].filter(Boolean);

    var mailto =
      "mailto:intake@discretion.example" +
      "?subject=" +
      encodeURIComponent("Discretion intake — " + name) +
      "&body=" +
      encodeURIComponent(lines.join("\n"));

    showStatus(
      "Request saved on this device. Opening your email client to send the brief…",
      true
    );
    form.reset();
    window.location.href = mailto;
  });
})();
