import type { AuthTestConfiguration } from '../application/configuration';
// Fictitious config for mocked tests only. No project exists or is contacted.
export const authTestFixture: AuthTestConfiguration = Object.freeze({
  mode: 'auth-test', projectId: 'mi-casa-unit-test', apiKey: 'fictitious-public-web-key-not-valid',
  authDomain: 'mi-casa-unit-test.firebaseapp.com', appId: '1:1234567890:web:0123456789abcdef',
  ownerUid: 'unit-authorized-owner', methods: Object.freeze(['google', 'password'] as const), googleFlow: 'popup',
  authorizedOrigin: 'http://localhost:5175', approval: 'owner-approved-auth-only:mi-casa-unit-test',
});
