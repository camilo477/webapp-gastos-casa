export class AuthenticationError extends Error {}

export function authenticationMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential': case 'auth/wrong-password': case 'auth/user-not-found': case 'auth/invalid-email':
      return 'No pudimos ingresar con esos datos. Revisa el correo y la contraseña.';
    case 'auth/network-request-failed': case 'auth/timeout':
      return 'No pudimos conectar. Revisa la conexión y vuelve a intentarlo.';
    case 'auth/user-disabled': case 'auth/user-token-expired': case 'auth/invalid-user-token':
      return 'Tu sesión terminó. Ingresa de nuevo para continuar.';
    case 'auth/too-many-requests':
      return 'Hubo varios intentos. Espera un momento y vuelve a intentarlo.';
    case 'auth/unauthorized-local-user':
      return 'Esta cuenta no tiene acceso. Utiliza la cuenta de prueba autorizada.';
    case 'auth/local-fixture-required':
      return 'Utiliza únicamente el correo ficticio de prueba terminado en @example.test.';
    case 'auth/web-storage-unsupported':
      return 'No pudimos conservar la sesión en este navegador. Revisa sus permisos de almacenamiento.';
    default:
      return 'No pudimos completar el acceso. Vuelve a intentarlo.';
  }
}
