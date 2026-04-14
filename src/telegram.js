const SOUND_ENABLED_KEY = "vf_sound_enabled_v1";
const VIBRO_ENABLED_KEY = "vf_vibro_enabled_v1";
const FRIENDS_INVITED_KEY = "vf_friends_invited_v1";

function getWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

function readBool(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw == null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function writeBool(storageKey, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function isSoundEnabled() {
  return readBool(SOUND_ENABLED_KEY, true);
}

export function setSoundEnabled(value) {
  writeBool(SOUND_ENABLED_KEY, Boolean(value));
}

export function isVibroEnabled() {
  return readBool(VIBRO_ENABLED_KEY, true);
}

export function setVibroEnabled(value) {
  writeBool(VIBRO_ENABLED_KEY, Boolean(value));
}

export function getInvitedFriendsCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(FRIENDS_INVITED_KEY);
    const num = Number(raw ?? "0");
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
  } catch {
    return 0;
  }
}

export function incrementInvitedFriendsCount() {
  const next = getInvitedFriendsCount() + 1;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FRIENDS_INVITED_KEY, String(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function getTelegramUserProfile() {
  const webApp = getWebApp();
  const user = webApp?.initDataUnsafe?.user ?? null;
  const firstName = user?.first_name ?? "";
  const lastName = user?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    username:
      user?.username != null && user.username !== ""
        ? `@${user.username}`
        : fullName || "Игрок",
    fullName: fullName || "Player",
    avatarUrl: user?.photo_url ?? "",
    id: user?.id ?? null,
  };
}

export function shareInviteLink() {
  const webApp = getWebApp();
  const inviteUrl =
    typeof window !== "undefined" ? window.location.href : "https://t.me";
  const text = "Залетай в игру, вместе будет веселее!";
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(tgShareUrl);
    return;
  }
  if (typeof window !== "undefined") {
    window.open(tgShareUrl, "_blank", "noopener,noreferrer");
  }
}
