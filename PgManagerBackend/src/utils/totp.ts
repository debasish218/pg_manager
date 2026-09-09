import speakeasy from 'speakeasy';

export const generateTOTPSecret = (phoneNumber: string): { secret: string; qrCodeUri: string } => {
  const secret = speakeasy.generateSecret({
    name: `PgManager:${phoneNumber}`,
    issuer: 'PgManager',
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCodeUri: secret.otpauth_url || '',
  };
};

export const verifyTOTPCode = (secret: string, code: string): boolean => {
  try {
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow ±2 time steps (60 seconds total)
    });
    return isValid;
  } catch (error) {
    return false;
  }
};
