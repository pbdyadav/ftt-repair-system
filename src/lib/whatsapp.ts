// src/lib/whatsapp.ts
export const sanitizePhone = (raw: string, defaultCountryCode = '91'): string | null => {
  if (!raw) return null;
  // Remove non-digit characters
  const digits = raw.replace(/\D+/g, '');
  // If user provided country code (starts with 1-3 digits in typical cases), keep it.
  // If length looks like local (10 digits for India), prepend default country code.
  if (digits.length >= 11) return digits; // assume includes country code
  if (digits.length === 10) return defaultCountryCode + digits;
  // otherwise return null - invalid
  return null;
};

export const buildWhatsAppUrl = (toNumber: string, text: string) => {
  // Use web.whatsapp.com on desktop otherwise wa.me on mobile
  const encoded = encodeURIComponent(text);
  // wa.me supports https://wa.me/<number>?text=...
  return `https://wa.me/${toNumber}?text=${encoded}`;
};

export const openWhatsAppTo = (toNumberRaw: string, text: string, defaultCC = '91') => {
  const to = sanitizePhone(toNumberRaw, defaultCC);
  if (!to) {
    alert('Invalid customer phone number. Please enter a valid number including area code.');
    return;
  }

  const url = buildWhatsAppUrl(to, text);

  // Open new tab or window — call from user gesture (button click) to avoid blockers.
  window.open(url, '_blank');
};
