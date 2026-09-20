/**
 * Shared helpers for Discretion client / investigator web portals.
 * Requires Firebase compat SDK + window.DISCRETION_CONFIG from config.js
 */
(function (global) {
  const MIN_ADULT_AGE = 18;

  const DANGER_FLAG_KEYWORDS = [
    "catch them",
    "confront",
    "catch him",
    "catch her",
    "beat",
    "hurt them",
    "kill",
    "weapon",
    "ambush",
  ];

  const OUT_OF_SCOPE_FLAG_KEYWORDS = [
    "minor",
    "underage",
    "child custody",
    "stalk a child",
    "teenager",
    "high school student",
    "predator",
    "cheating on a test",
    "corporate espionage",
    "employee theft",
  ];

  function getConfig() {
    if (!global.DISCRETION_CONFIG) {
      throw new Error(
        "Missing config.js — copy config.example.js to config.js and add Firebase settings.",
      );
    }
    return global.DISCRETION_CONFIG;
  }

  function initFirebase() {
    const cfg = getConfig();
    if (!global.firebase?.apps?.length) {
      global.firebase.initializeApp(cfg.firebase);
    }
    return {
      auth: global.firebase.auth(),
      db: global.firebase.firestore(),
    };
  }

  function ageFromDateString(dateStr) {
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  }

  function isAdult(dateStr) {
    const age = ageFromDateString(dateStr);
    return age != null && age >= MIN_ADULT_AGE;
  }

  function computeSoftFlags(...texts) {
    const blob = texts.filter(Boolean).join(" ").toLowerCase();
    const flags = [];
    for (const kw of DANGER_FLAG_KEYWORDS) {
      if (blob.includes(kw)) flags.push(`danger:${kw}`);
    }
    for (const kw of OUT_OF_SCOPE_FLAG_KEYWORDS) {
      if (blob.includes(kw)) flags.push(`scope:${kw}`);
    }
    return [...new Set(flags)];
  }

  function statusLabel(accountStatus) {
    switch (accountStatus) {
      case "pending":
        return "Under review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Not approved";
      case "blocked":
        return "Blocked";
      default:
        return accountStatus || "Unknown";
    }
  }

  function caseStatusLabel(status) {
    if (!status) return "—";
    return status.replace(/_/g, " ");
  }

  function formatTimestamp(ms) {
    if (!ms) return "—";
    return new Date(ms).toLocaleString();
  }

  async function ensurePortalProfile(auth, db, expectedRole) {
    const user = auth.currentUser;
    if (!user) return null;

    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const profile = {
        role: expectedRole,
        displayName: user.displayName || user.email?.split("@")[0] || "Applicant",
        email: user.email || "",
        createdAt: Date.now(),
        accountStatus: "pending",
        applicationSubmitted: false,
        appPasswordSet: false,
        provisionedByAdmin: false,
      };
      await ref.set(profile);
      return profile;
    }

    const data = snap.data();
    if (data.role !== expectedRole) {
      await auth.signOut();
      throw new Error(
        `This Google account is registered as ${data.role}. Use the matching portal.`,
      );
    }
    return data;
  }

  async function signInWithGoogle(auth, expectedRole) {
    const provider = new global.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await auth.signInWithPopup(provider);
    const { db } = initFirebase();
    return ensurePortalProfile(auth, db, expectedRole);
  }

  async function signOut(auth) {
    await auth.signOut();
  }

  async function watchProfile(auth, db, expectedRole, onChange) {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) {
        onChange(null, null);
        return;
      }
      try {
        const ref = db.collection("users").doc(user.uid);
        const snap = await ref.get();
        if (!snap.exists) {
          const profile = await ensurePortalProfile(auth, db, expectedRole);
          onChange(user, profile);
          return;
        }
        const data = snap.data();
        if (data.role !== expectedRole) {
          await auth.signOut();
          onChange(null, null);
          return;
        }
        onChange(user, data);
      } catch (err) {
        console.error(err);
        onChange(user, null);
      }
    });
  }

  async function setAppPassword(password) {
    const cfg = getConfig();
    const base = (cfg.r2SignUrl || "").replace(/\/$/, "");
    if (!base) throw new Error("r2SignUrl not configured in config.js");
    const { auth } = initFirebase();
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in required");
    const token = await user.getIdToken();
    const res = await fetch(`${base}/portal/set-app-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      throw new Error(json.hint || json.error || text || `Request failed (${res.status})`);
    }
    return json;
  }

  async function listClientCases(db, uid) {
    const snap = await db
      .collection("cases")
      .where("clientId", "==", uid)
      .orderBy("updatedAt", "desc")
      .limit(5)
      .get()
      .catch(async () => {
        // Fallback when composite index missing
        const all = await db.collection("cases").where("clientId", "==", uid).get();
        return all;
      });
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  function showSection(id) {
    document.querySelectorAll("[data-portal-section]").forEach((el) => {
      el.hidden = el.id !== id;
    });
  }

  function setStatusMessage(el, message, kind) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.className = `form-status${kind ? ` ${kind}` : ""}`;
  }

  global.DiscretionPortal = {
    MIN_ADULT_AGE,
    getConfig,
    initFirebase,
    ageFromDateString,
    isAdult,
    computeSoftFlags,
    statusLabel,
    caseStatusLabel,
    formatTimestamp,
    ensurePortalProfile,
    signInWithGoogle,
    signOut,
    watchProfile,
    setAppPassword,
    listClientCases,
    showSection,
    setStatusMessage,
  };
})(window);
