import admin from 'firebase-admin';
import { config } from './index';
let firebaseApp: admin.app.App | null = null;
if (config.firebase.projectId && config.firebase.privateKey) {
  firebaseApp = admin.initializeApp({ credential: admin.credential.cert({ projectId: config.firebase.projectId, privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'), clientEmail: config.firebase.clientEmail }) });
}
export { firebaseApp };
export default firebaseApp;
