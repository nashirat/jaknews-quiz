// Auth utils for password protection
export const ADMIN_PASSWORD = "2017c0d536";

// Function to check if a password is correct
export function isValidAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// In browser environments, these functions handle sessionStorage
export function setAdminAuthorized(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem("quiz_admin_authorized", "true");
  }
}

export function isAdminAuthorized(): boolean {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem("quiz_admin_authorized") === "true";
  }
  return false;
}

export function clearAdminAuthorization(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem("quiz_admin_authorized");
  }
} 