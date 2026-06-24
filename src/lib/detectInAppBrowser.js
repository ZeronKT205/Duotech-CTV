/**
 * Detect if the current browser is an in-app browser (WebView)
 * from apps like Zalo, Facebook, Instagram, Threads, TikTok, etc.
 * 
 * Google blocks OAuth sign-in from these embedded browsers for security.
 */

const IN_APP_PATTERNS = [
  { pattern: /FBAN|FBAV/i, name: 'Facebook' },
  { pattern: /Instagram/i, name: 'Instagram' },
  { pattern: /Threads/i, name: 'Threads' },
  { pattern: /Zalo/i, name: 'Zalo' },
  { pattern: /TikTok|musical_ly|BytedanceWebview/i, name: 'TikTok' },
  { pattern: /Line\//i, name: 'LINE' },
  { pattern: /KAKAOTALK/i, name: 'KakaoTalk' },
  { pattern: /Snapchat/i, name: 'Snapchat' },
  { pattern: /Twitter|TwitterAndroid/i, name: 'Twitter/X' },
  { pattern: /MicroMessenger/i, name: 'WeChat' },
  { pattern: /Viber/i, name: 'Viber' },
  { pattern: /Telegram/i, name: 'Telegram' },
  // Generic WebView detection (fallback)
  { pattern: /wv\)|WebView/i, name: 'WebView' },
];

/**
 * Check if the current browser is an in-app browser
 * @returns {boolean}
 */
export function isInAppBrowser() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  const ua = navigator.userAgent;
  return IN_APP_PATTERNS.some(({ pattern }) => pattern.test(ua));
}

/**
 * Get the name of the in-app browser (e.g., "Zalo", "Facebook")
 * @returns {string|null}
 */
export function getInAppBrowserName() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null;
  const ua = navigator.userAgent;
  const match = IN_APP_PATTERNS.find(({ pattern }) => pattern.test(ua));
  return match ? match.name : null;
}

/**
 * Check if the device is iOS
 * @returns {boolean}
 */
export function isIOS() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if the device is Android
 * @returns {boolean}
 */
export function isAndroid() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Try to open the current URL in an external browser.
 * Uses intent:// scheme on Android, and guides on iOS.
 * @param {string} url - The URL to open in external browser
 * @returns {boolean} - true if attempted redirect, false if fallback needed
 */
export function openInExternalBrowser(url) {
  const targetUrl = url || window.location.href;

  if (isAndroid()) {
    // Android: Use intent:// scheme to open Chrome
    const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return true;
  }

  if (isIOS()) {
    // iOS: Try to open in Safari using x-safari-https scheme
    // This works from some in-app browsers
    const safariUrl = `x-safari-https://${targetUrl.replace(/^https?:\/\//, '')}`;
    window.location.href = safariUrl;
    
    // Fallback: after a short delay, if still here, the scheme didn't work
    setTimeout(() => {
      // Copy to clipboard as fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(targetUrl);
      }
    }, 1500);
    return true;
  }

  return false;
}
