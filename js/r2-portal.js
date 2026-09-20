/**
 * Upload portal documents (ID, selfie, subject photos) via r2-sign Worker.
 */
(function (global) {
  async function uploadPortalDoc(file) {
    const cfg = global.DiscretionPortal.getConfig();
    const base = (cfg.r2SignUrl || "").replace(/\/$/, "");
    if (!base) throw new Error("r2SignUrl not configured");

    const { auth } = global.DiscretionPortal.initFirebase();
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in required");

    const contentType = file.type || "application/octet-stream";
    const token = await user.getIdToken();
    const signRes = await fetch(`${base}/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        purpose: "portal_doc",
        contentType,
        action: "put",
      }),
    });
    const signText = await signRes.text();
    let signJson = {};
    try {
      signJson = JSON.parse(signText);
    } catch {
      /* ignore */
    }
    if (!signRes.ok) {
      throw new Error(signJson.hint || signJson.error || signText || "Sign failed");
    }

    const uploadUrl = signJson.uploadUrl || signJson.url;
    const storageKey = signJson.storageKey;
    if (!uploadUrl || !storageKey) throw new Error("Invalid sign response");

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, ...(signJson.headers || {}) },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }
    return storageKey;
  }

  global.DiscretionR2 = { uploadPortalDoc };
})(window);
