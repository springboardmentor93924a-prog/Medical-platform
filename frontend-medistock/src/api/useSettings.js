import { useEffect, useState } from "react";
import api from "./client.js";

// The few settings every page needs. Kept in memory so each page does not ask again.
const DEFAULTS = { organisationName: "MediStock", defaultReorderLevel: 50, requireOrderApproval: true };
let cache = null;

export function useSettings() {
  const [settings, setSettings] = useState(cache ?? DEFAULTS);

  useEffect(() => {
    const load = () => api.get("/api/settings/public")
      .then((res) => { cache = res.data; setSettings(res.data); })
      .catch(() => { /* keep the defaults if the request fails */ });
    load();
    window.addEventListener("settings-changed", load);   // the Settings page sends this after saving
    return () => window.removeEventListener("settings-changed", load);
  }, []);

  return settings;
}