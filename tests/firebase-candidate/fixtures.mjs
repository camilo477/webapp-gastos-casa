import { createRequire } from 'node:module';
import { applyCommand,toDocument } from '@mi-casa/inventory-contract';
import { LOCAL,requireLocal,requireRuntime } from '../../functions/lib/config/local.js';
const requireServer=createRequire(new URL('../../functions/package.json',import.meta.url));
const {initializeApp,deleteApp}=requireServer('firebase-admin/app');const {getFirestore,Timestamp}=requireServer('firebase-admin/firestore');
export async function seedCandidate(count,legacy=false){
 requireRuntime();requireLocal();if(![1,100,500,1000].includes(count))throw Error('FIXTURE_COUNT_NOT_ALLOWED');
 const app=initializeApp({projectId:LOCAL.projectId},'candidate-fixtures');const db=getFirestore(app);
 try{
  for(let offset=0;offset<count;offset+=100){const batch=db.batch();
   for(let i=offset;i<Math.min(offset+100,count);i++){
    const id='p'+String(i).padStart(5,'0');
    const p=applyCommand({schemaVersion:2,kind:'create',operationId:'fixture-'+id,productId:id,definition:{name:i===count-1?'Café final ficticio':`Producto candidato ${i}`,presentation:'Bolsa 500 g',categoryId:'food',control:'exact',baseUnit:'kg'},opening:{quantity:{unit:'kg',amountMilli:1250}},duplicateDecision:'reviewed-new'},null,Date.now());
    batch.create(db.doc(`users/${LOCAL.uid}/products/${id}`),legacy?{name:'Producto anterior ficticio',categoryId:'food',control:'exact',unit:'kg',quantityMilli:1000,version:0,updatedAt:Timestamp.now()}:toDocument(p,t=>Timestamp.fromMillis(t)));
   }await batch.commit();
  }
 }finally{await db.terminate();await deleteApp(app);}
}
