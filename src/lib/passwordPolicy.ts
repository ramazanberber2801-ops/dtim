export const PASSWORD_REQUIREMENT_MESSAGE =
  'Passordet må ha minst 6 tegn og inneholde stor bokstav, liten bokstav, tall og spesialtegn.';

export function isValidPassword(password: string) {
  return password.length >= 6
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
