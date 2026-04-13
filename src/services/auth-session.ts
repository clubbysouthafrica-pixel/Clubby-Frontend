import axios from "axios";
import { matchPath } from "react-router-dom";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ADMIN_KEY = "isAdmin";
const ACTIVE_CLUB_KEY = "activeClub";

let isRedirectingToLogin = false;
const EXPLICIT_DENY_MESSAGE = "user is not authorized to access this resource with an explicit deny in an identity-based policy";

const ADMIN_REDIRECT_PATTERNS = [
  "/",
  "/myclubs",
  "/settings",
  "/billing&usage",
  "/manage/members",
  "/manage/member/registrations",
  "/manage/members/add",
  "/manage/club",
  "/manage/registrations/forms",
  "/reporting/registration",
  "/reporting/general",
  "/reporting/shop",
  "/reporting/transactions",
  "/shop",
  "/shop/products",
  "/shop/orders",
  "/shop/analytics",
  "/venues",
  "/venues/bookings",
  "/events",
  "/events/registrations",
];

const MEMBER_REDIRECT_PATTERNS = [
  "/onboardMember",
  "/clubs/:clubId/register",
  "/myclubs",
  "/myclubs/:clubId",
  "/myclubs/:clubId/shop",
  "/myclubs/:clubId/store",
  "/myclubs/:clubId/payments",
  "/myclubs/:clubId/registration",
  "/myclubs/:clubId/bookings",
  "/myclubs/:clubId/events",
  "/myclubs/:clubId/events/:eventId/register",
  "/myclubs/:clubId/invite",
  "/settings",
];

function getPathname(targetPath: string) {
  try {
    return new URL(targetPath, "https://myclubsoftware.local").pathname;
  } catch {
    return "/";
  }
}

function matchesRoutePattern(pathname: string, patterns: string[]) {
  return patterns.some((pattern) => matchPath({ path: pattern, end: true }, pathname));
}

function normalizeRedirectTarget(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) {
    return "/";
  }

  return path;
}

export function getCurrentPathWithSearch() {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function buildLoginRedirectPath(targetPath: string) {
  const normalizedTarget = normalizeRedirectTarget(targetPath);
  const searchParams = new URLSearchParams({ redirect: normalizedTarget });

  return `/login?${searchParams.toString()}`;
}

export function getSafeRedirectTarget(targetPath: string | null | undefined) {
  if (!targetPath) {
    return "/";
  }

  return normalizeRedirectTarget(targetPath);
}

export function isRedirectTargetValidForPortal(
  targetPath: string | null | undefined,
  portal: "admin" | "member",
) {
  const normalizedTarget = getSafeRedirectTarget(targetPath);
  const pathname = getPathname(normalizedTarget);

  return matchesRoutePattern(
    pathname,
    portal === "admin" ? ADMIN_REDIRECT_PATTERNS : MEMBER_REDIRECT_PATTERNS,
  );
}

export function getPortalRedirectTarget(
  targetPath: string | null | undefined,
  portal: "admin" | "member",
) {
  if (!isRedirectTargetValidForPortal(targetPath, portal)) {
    return "/";
  }

  return getSafeRedirectTarget(targetPath);
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ACTIVE_CLUB_KEY);

  delete axios.defaults.headers.common.Authorization;
}

export function handleUnauthorizedSession() {
  clearStoredAuth();

  if (isRedirectingToLogin || typeof window === "undefined") {
    return;
  }

  isRedirectingToLogin = true;

  if (window.location.pathname !== "/login") {
    window.location.replace(buildLoginRedirectPath(getCurrentPathWithSearch()));
  }
}

export function shouldHandleUnauthorizedError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;

  if (status === 401) {
    return true;
  }

  if (status !== 403) {
    return false;
  }

  const responseMessage = error.response?.data?.message;

  return typeof responseMessage === "string" && responseMessage.toLowerCase() === EXPLICIT_DENY_MESSAGE;
}