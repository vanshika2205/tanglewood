/**
 * Samtulan Security Utility
 * Provides URL scanning and threat detection for the AI Link Shield.
 */

const BLACKLIST_DOMAINS = [
  "bit.ly", "t.co", "free-coins.xyz", "phishing-clon.com", 
  "hack-your-account.biz", "scam-prize.net", "malware-distro.org",
  "get-free-subs.com", "win-iphone-15.online"
];

const HIGH_RISK_KEYWORDS = [
  "login", "verify", "account", "bank", "password", "gift", "prize"
];

export function scanURL(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // 1. Check if it's internal
    if (domain === "localhost" || domain.includes("samtulan")) {
      return { safe: true, type: "internal" };
    }

    // 2. Check Blacklist
    if (BLACKLIST_DOMAINS.some(b => domain === b || domain.endsWith("." + b))) {
      return { 
        safe: false, 
        reason: "This domain is known for phishing or distributing malware.", 
        type: "blacklist",
        risk: "High"
      };
    }

    // 3. Check for suspicious redirects/shorteners
    const shorteners = ["bit.ly", "is.gd", "buff.ly", "tinyurl.com"];
    if (shorteners.includes(domain)) {
      return {
        safe: false,
        reason: "Link shorteners are often used to hide malicious destinations.",
        type: "shortener",
        risk: "Medium"
      };
    }

    // 4. Heuristic: Keywords in subdomain/path for non-trusted domains
    const path = urlObj.pathname.toLowerCase();
    if (HIGH_RISK_KEYWORDS.some(k => (domain.includes(k) || path.includes(k)))) {
       return {
         safe: false,
         reason: "The URL structure looks like it might be trying to steal account information.",
         type: "heuristic",
         risk: "Medium"
       };
    }

    return { safe: true, type: "neutral" };
  } catch (e) {
    // If invalid URL, it's likely safe or broken
    return { safe: true, type: "invalid" };
  }
}
