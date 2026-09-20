/**
 * Investigator portal — Google sign-in, application, dashboard.
 */
(function () {
  const P = window.DiscretionPortal;
  const R2 = window.DiscretionR2;

  let auth;
  let db;
  let unsubscribeProfile;

  const els = {
    setup: document.getElementById("portal-setup"),
    signInStatus: document.getElementById("sign-in-status"),
    googleBtn: document.getElementById("google-sign-in"),
    signOutBtn: document.getElementById("sign-out-btn"),
    applicationForm: document.getElementById("investigator-application-form"),
    applicationStatus: document.getElementById("application-status"),
    greeting: document.getElementById("dashboard-greeting"),
    accountStatusLine: document.getElementById("account-status-line"),
    accountStatusDetail: document.getElementById("account-status-detail"),
    messages: document.getElementById("portal-messages"),
    approvedActions: document.getElementById("approved-actions"),
    passwordForm: document.getElementById("app-password-form"),
    passwordStatus: document.getElementById("password-status"),
    appPasswordSetNote: document.getElementById("app-password-set-note"),
    appDownload: document.getElementById("investigator-app-download"),
  };

  function boot() {
    try {
      const cfg = P.getConfig();
      if (els.appDownload) els.appDownload.href = cfg.investigatorAppUrl || "#";
      const fb = P.initFirebase();
      auth = fb.auth;
      db = fb.db;
      P.showSection("portal-sign-in");
      bindEvents();
      unsubscribeProfile = P.watchProfile(auth, db, "investigator", renderState);
    } catch (err) {
      P.showSection("portal-setup");
      const setup = document.getElementById("portal-setup");
      if (setup) setup.querySelector(".section-lede").textContent = err.message;
    }
  }

  function bindEvents() {
    els.googleBtn?.addEventListener("click", async () => {
      P.setStatusMessage(els.signInStatus, "", "");
      els.googleBtn.disabled = true;
      try {
        await P.signInWithGoogle(auth, "investigator");
      } catch (err) {
        P.setStatusMessage(els.signInStatus, err.message || "Sign-in failed", "error");
      } finally {
        els.googleBtn.disabled = false;
      }
    });

    els.signOutBtn?.addEventListener("click", async () => {
      await P.signOut(auth);
    });

    els.applicationForm?.addEventListener("submit", submitApplication);

    els.passwordForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(els.passwordForm);
      const pw = String(fd.get("appPassword") || "");
      const confirm = String(fd.get("appPasswordConfirm") || "");
      if (pw.length < 6) {
        P.setStatusMessage(els.passwordStatus, "Password must be at least 6 characters.", "error");
        return;
      }
      if (pw !== confirm) {
        P.setStatusMessage(els.passwordStatus, "Passwords do not match.", "error");
        return;
      }
      try {
        await P.setAppPassword(pw);
        P.setStatusMessage(els.passwordStatus, "App password saved.", "ok");
        els.passwordForm.reset();
        if (els.appPasswordSetNote) els.appPasswordSetNote.hidden = false;
      } catch (err) {
        P.setStatusMessage(els.passwordStatus, err.message || "Could not set password", "error");
      }
    });
  }

  async function submitApplication(ev) {
    ev.preventDefault();
    const fd = new FormData(els.applicationForm);
    const legalName = String(fd.get("legalName") || "").trim();
    const dateOfBirth = String(fd.get("dateOfBirth") || "");
    const phone = String(fd.get("phone") || "").trim();
    const cityRegion = String(fd.get("cityRegion") || "").trim();
    const experience = String(fd.get("experience") || "").trim();
    const availability = String(fd.get("availability") || "").trim();
    const idFile = fd.get("idDocument");
    const selfieFile = fd.get("idSelfie");

    if (!P.isAdult(dateOfBirth)) {
      P.setStatusMessage(els.applicationStatus, "You must be 18 or older to apply.", "error");
      return;
    }
    if (!idFile?.size || !selfieFile?.size) {
      P.setStatusMessage(els.applicationStatus, "ID and selfie uploads are required.", "error");
      return;
    }
    if (!fd.get("affirmLawful") || !fd.get("affirmAdults")) {
      P.setStatusMessage(els.applicationStatus, "All affirmations are required.", "error");
      return;
    }

    const submitBtn = document.getElementById("submit-application");
    submitBtn.disabled = true;
    P.setStatusMessage(els.applicationStatus, "Uploading documents…", "");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in required");

      const idDocumentKey = await R2.uploadPortalDoc(idFile);
      const idSelfieKey = await R2.uploadPortalDoc(selfieFile);
      const flags = P.computeSoftFlags(experience, availability, cityRegion);

      await db.collection("users").doc(user.uid).update({
        legalName,
        dateOfBirth,
        phone,
        cityRegion,
        experience,
        availability,
        idDocumentKey,
        idSelfieKey,
        displayName: legalName,
        flags,
        applicationSubmitted: true,
      });

      P.setStatusMessage(els.applicationStatus, "Application submitted.", "ok");
    } catch (err) {
      P.setStatusMessage(els.applicationStatus, err.message || "Submission failed", "error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  function renderState(user, profile) {
    if (els.signOutBtn) els.signOutBtn.hidden = !user;

    if (!user || !profile) {
      P.showSection("portal-sign-in");
      return;
    }

    if (!profile.applicationSubmitted) {
      P.showSection("portal-onboarding");
      return;
    }

    P.showSection("portal-dashboard");
    const name = profile.legalName || profile.displayName || user.email;
    if (els.greeting) {
      els.greeting.textContent = `Signed in as ${name}. Case access is via the Schedule Helper app after approval.`;
    }

    const accountStatus = profile.accountStatus || "pending";
    if (els.accountStatusLine) {
      els.accountStatusLine.textContent = P.statusLabel(accountStatus);
      els.accountStatusLine.dataset.status = accountStatus;
    }
    if (els.accountStatusDetail) {
      const detail = {
        pending: "Operations is reviewing your field application.",
        approved: "Approved — set your app password, then sign into Schedule Helper.",
        rejected: profile.rejectionReason || "Application not approved.",
        blocked: profile.blockedReason || "Account blocked.",
      };
      els.accountStatusDetail.textContent = detail[accountStatus] || "";
    }

    const messages = [];
    if (accountStatus === "pending") messages.push("Your investigator application is under review.");
    if (accountStatus === "approved") messages.push("Your field account has been approved.");
    if (accountStatus === "rejected") {
      messages.push(`Application declined${profile.rejectionReason ? `: ${profile.rejectionReason}` : "."}`);
    }
    if (accountStatus === "blocked") {
      messages.push(`Account blocked${profile.blockedReason ? `: ${profile.blockedReason}` : "."}`);
    }
    if (!messages.length) messages.push("No new notifications.");
    if (els.messages) {
      els.messages.innerHTML = messages.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
    }

    if (els.approvedActions) els.approvedActions.hidden = accountStatus !== "approved";
    if (els.passwordForm) els.passwordForm.hidden = !!profile.appPasswordSet;
    if (els.appPasswordSetNote) els.appPasswordSetNote.hidden = !profile.appPasswordSet;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("DOMContentLoaded", boot);
  window.addEventListener("beforeunload", () => {
    if (typeof unsubscribeProfile === "function") unsubscribeProfile();
  });
})();
