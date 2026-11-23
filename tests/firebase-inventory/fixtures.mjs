import { createRequire } from 'node:module';
import { LOCAL, requireLocal, requireRuntime } from '../../functions/lib/config/local.js';
const requireServer = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requireServer('firebase-admin/app');
const { getFirestore, Timestamp } = requireServer('firebase-admin/firestore');

// Test provisioning only. No application bundle imports this module; no external project is accepted.
export async function inventoryFixture(count) {
  requireRuntime(); requireLocal();
  if (![100,500,1000].includes(count)) throw Error('FIXTURE_COUNT_NOT_ALLOWED');
  const app=initializeApp({projectId:LOCAL.projectId},'inventory-fixture-'+count);
  const db=getFirestore(app);
  try {
    for(let offset=0;offset<count;offset+=100) {
      const batch=db.batch();
      for(let i=offset;i<Math.min(offset+100,count);i++)batch.create(db.doc(`users/${LOCAL.uid}/products/p${String(i).padStart(5,'0')}`),{
        name:i===count-1?'Selección final ficticia':`Producto de prueba ${i}`,categoryId:'food',control:'exact',unit:'unidad',quantityMilli:1000,version:0,updatedAt:Timestamp.now(),
      });
      await batch.commit();
    }
  } finally { await db.terminate(); await deleteApp(app); }
}
