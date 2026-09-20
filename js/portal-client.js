/**
 * Client portal — Google sign-in, onboarding, dashboard.
 */
(function () {
  const P = window.DiscretionPortal;
  const R2 = window.DiscretionR2;

  let auth;
  let db;
  let unsubscribeProfile;

  const els = {
    setup: document.getElementById("portal-setup"),
    signIn: document.getElementById("portal-sign-in"),
    onboarding: document.getElementById("portal-onboarding"),
    dashboard: document.getElementById("portal-dashboard"),
    googleBtn: document.getElementById("google-sign-in"),
    signInStatus: document.getElementById("sign-in-status"),
    signOutBtn: document.getElementById("sign-out-btn"),
    applicationForm: document.getElementById("client-application-form"),
    applicationStatus: document.getElementById("application-status"),
    greeting: document.getElementById("dashboard-greeting"),
    accountStatusLine: document.getElementById("account-status-line"),
    accountStatusDetail: document.getElementById("account-status-detail"),
    caseStatusLine: document.getElementById("case-status-line"),
    caseStatusDetail: document.getElementById("case-status-detail"),
    messages: document.getElementById("portal-messages"),
    approvedActions: document.getElementById("approved-actions"),
    passwordForm: document.getElementById("app-password-form"),
    passwordStatus: document.getElementById("password-status"),
    appPasswordSetNote: document.getElementById("app-password-set-note"),
    appDownload: document.getElementById("client-app-download"),
  };

  function boot() {
    try {
      const cfg = P.getConfig();
      if (els.appDownload) els.appDownload.href = cfg.clientAppUrl || "#";
      const fb = P.initFirebase();
      auth = fb.auth;
      db = fb.db;
      P.showSection("portal-sign-in");
      bindEvents();
      unsubscribeProfile = P.watchProfile(auth, db, "client", renderState);
    } catch (err) {
      P.showSection("portal-setup");
      if (els.setup) {
        els.setup.querySelector(".section-lede").textContent = err.message;
      }
    }
  }

  function bindEvents() {
    els.googleBtn?.addEventListener("click", async () => {
      P.setStatusMessage(els.signInStatus, "", "");
      els.googleBtn.disabled = true;
      try {
        await P.signInWithGoogle(auth, "client");
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
      P.setStatusMessage(els.passwordStatus, "Saving…", "");
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
    const subjectName = String(fd.get("subjectName") || "").trim();
    const subjectEstimatedAge = Number(fd.get("subjectEstimatedAge"));
    const knownPlaces = String(fd.get("knownPlaces") || "").trim();
    const relationshipContext = String(fd.get("relationshipContext") || "").trim();
    const leadsNotes = String(fd.get("leadsNotes") || "").trim();

    if (!P.isAdult(dateOfBirth)) {
      P.setStatusMessage(els.applicationStatus, "You must be 18 or older to apply.", "error");
      return;
    }
    if (!subjectEstimatedAge || subjectEstimatedAge < 18) {
      P.setStatusMessage(els.applicationStatus, "Subject estimated age must be 18 or older.", "error");
      return;
    }
    if (!fd.get("affirmAdults") || !fd.get("affirmLawful") || !fd.get("affirmPurpose")) {
      P.setStatusMessage(els.applicationStatus, "All affirmations are required.", "error");
      return;
    }

    const submitBtn = document.getElementById("submit-application");
    submitBtn.disabled = true;
    P.setStatusMessage(els.applicationStatus, "Uploading documents…", "");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in required");

      let idDocumentKey = null;
      const idFile = fd.get("idDocument");
      if (idFile && idFile.size) {
        idDocumentKey = await R2.uploadPortalDoc(idFile);
      }

      const subjectPhotoKeys = [];
      const photoInput = els.applicationForm.querySelector('[name="subjectPhotos"]');
      if (photoInput?.files?.length) {
        for (const file of photoInput.files) {
          subjectPhotoKeys.push(await R2.uploadPortalDoc(file));
        }
      }

      const flags = P.computeSoftFlags(
        relationshipContext,
        leadsNotes,
        knownPlaces,
        subjectName,
      );

      const now = Date.now();
      const userPatch = {
        legalName,
        dateOfBirth,
        phone,
        displayName: legalName,
        leadsNotes,
        flags,
        applicationSubmitted: true,
        subject: {
          name: subjectName,
          estimatedAge: subjectEstimatedAge,
          knownPlaces,
          relationshipContext,
          photoKeys: subjectPhotoKeys,
          description: relationshipContext,
        },
      };
      if (idDocumentKey) userPatch.idDocumentKey = idDocumentKey;

      await db.collection("users").doc(user.uid).update(userPatch);

      P.setStatusMessage(els.applicationStatus, "Creating case brief…", "");
      await db.collection("cases").add({
        clientId: user.uid,
        status: "submitted",
        title: `Investigation — ${subjectName}`,
        subject: {
          name: subjectName,
          estimatedAge: subjectEstimatedAge,
          knownPlaces,
          relationshipContext,
          description: relationshipContext,
          photoKeys: subjectPhotoKeys,
        },
        assignedInvestigatorIds: [],
        flags,
        createdAt: now,
        updatedAt: now,
      });

      P.setStatusMessage(els.applicationStatus, "Application submitted.", "ok");
    } catch (err) {
      P.setStatusMessage(els.applicationStatus, err.message || "Submission failed", "error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function renderState(user, profile) {
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
      els.greeting.textContent = `Signed in as ${name}. We will notify you here when your account or case status changes.`;
    }

    const accountStatus = profile.accountStatus || "pending";
    if (els.accountStatusLine) {
      els.accountStatusLine.textContent = P.statusLabel(accountStatus);
      els.accountStatusLine.dataset.status = accountStatus;
    }
    if (els.accountStatusDetail) {
      if (accountStatus === "pending") {
        els.accountStatusDetail.textContent =
          "Operations is reviewing your identity and application details.";
      } else if (accountStatus === "approved") {
        els.accountStatusDetail.textContent = "Your account is approved. Set an app password below.";
      } else if (accountStatus === "rejected") {
        els.accountStatusDetail.textContent = profile.rejectionReason || "See messages below.";
      } else if (accountStatus === "blocked") {
        els.accountStatusDetail.textContent = profile.blockedReason || "Contact support if you believe this is an error.";
      }
    }

    const cases = await P.listClientCases(db, user.uid);
    const primaryCase = cases[0];
    if (els.caseStatusLine) {
      els.caseStatusLine.textContent = primaryCase
        ? P.caseStatusLabel(primaryCase.status)
        : "No case yet";
      if (primaryCase) els.caseStatusLine.dataset.status = primaryCase.status;
    }
    if (els.caseStatusDetail) {
      if (!primaryCase) {
        els.caseStatusDetail.textContent = "—";
      } else if (primaryCase.status === "submitted" || primaryCase.status === "intake") {
        els.caseStatusDetail.textContent = "Awaiting case acceptance by operations.";
      } else if (primaryCase.status === "accepted") {
        els.caseStatusDetail.textContent = "Case accepted — field assignment follows.";
      } else if (primaryCase.status === "declined" || primaryCase.status === "rejected") {
        els.caseStatusDetail.textContent =
          primaryCase.declineNotes ||
          primaryCase.declineReason?.replace(/_/g, " ") ||
          "Case was declined.";
      } else {
        els.caseStatusDetail.textContent = `Updated ${P.formatTimestamp(primaryCase.updatedAt)}`;
      }
    }

    const messages = [];
    if (accountStatus === "pending") {
      messages.push("Your account application is under review.");
    }
    if (accountStatus === "approved") {
      messages.push("Your account has been approved.");
    }
    if (accountStatus === "rejected") {
      messages.push(`Account not approved${profile.rejectionReason ? `: ${profile.rejectionReason}` : "."}`);
    }
    if (accountStatus === "blocked") {
      messages.push(`Account blocked${profile.blockedReason ? `: ${profile.blockedReason}` : "."}`);
    }
    if (primaryCase?.status === "accepted") {
      messages.push("Your investigation case has been accepted.");
    }
    if (primaryCase?.status === "declined" || primaryCase?.status === "rejected") {
      messages.push("Your investigation case was declined.");
    }
    if (!messages.length) {
      messages.push("No new notifications.");
    }
    if (els.messages) {
      els.messages.innerHTML = messages.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
    }

    const showApproved = accountStatus === "approved";
    if (els.approvedActions) els.approvedActions.hidden = !showApproved;
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
