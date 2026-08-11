const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

function required(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function minLength(value, len) {
  return typeof value === 'string' && value.trim().length >= len;
}

function validateRegistration(body) {
  const errors = {};
  if (!required(body.firstName)) errors.firstName = 'First name is required.';
  if (!required(body.lastName)) errors.lastName = 'Last name is required.';
  if (!isEmail(body.email)) errors.email = 'Enter a valid email address.';
  if (!minLength(body.password, 8)) errors.password = 'Password must be at least 8 characters.';
  if (body.password !== body.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

function validateLogin(body) {
  const errors = {};
  if (!isEmail(body.email)) errors.email = 'Enter a valid email address.';
  if (!required(body.password)) errors.password = 'Password is required.';
  return errors;
}

function validateShipping(body) {
  const errors = {};
  if (!required(body.firstName)) errors.firstName = 'First name is required.';
  if (!required(body.lastName)) errors.lastName = 'Last name is required.';
  if (!isEmail(body.email)) errors.email = 'Enter a valid email address.';
  if (!required(body.phone)) errors.phone = 'Phone number is required.';
  if (!required(body.country)) errors.country = 'Country is required.';
  if (!required(body.city)) errors.city = 'City is required.';
  if (!required(body.addressLine)) errors.addressLine = 'Address is required.';
  if (!required(body.postalCode)) errors.postalCode = 'Postal code is required.';
  return errors;
}

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

function validatePayment(body) {
  const errors = {};
  const digits = (body.cardNumber || '').replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) errors.cardNumber = 'Enter a valid card number.';
  if (!required(body.cardName)) errors.cardName = 'Cardholder name is required.';

  const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec((body.expiry || '').trim());
  if (!expiryMatch) {
    errors.expiry = 'Use MM/YY format.';
  } else {
    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    const now = new Date();
    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12) errors.expiry = 'Enter a valid month.';
    else if (expiryDate < now) errors.expiry = 'Card has expired.';
  }

  if (!/^\d{3,4}$/.test(body.cvv || '')) errors.cvv = 'Enter a valid CVV.';

  return { errors, digits, brand: digits ? detectCardBrand(digits) : null };
}

module.exports = {
  isEmail,
  required,
  minLength,
  validateRegistration,
  validateLogin,
  validateShipping,
  validatePayment,
  detectCardBrand
};
