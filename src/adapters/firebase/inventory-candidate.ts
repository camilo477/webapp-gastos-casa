import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore/lite';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { ContractError, parseCommand } from '@mi-casa/inventory-contract';
import { LOCAL_AUTH_UID, requireLocalAuthentication, type Configuration } from '../../application/configuration';
import { inventoryError, InventoryError } from '../../application/inventory';
import type { CandidateInventoryPort } from '../../application/inventory-candidate';
import { createCandidateReader } from './inventory-candidate-reader';

export function createCandidateInventory(config:Configuration,hostname:string):CandidateInventoryPort {
  requireLocalAuthentication(config,hostname);if(config.mode!=='emulator')throw new Error('LOCAL_INVENTORY_ONLY');
  const app=getApp('mi-casa-auth-local-05b-1'),auth=getAuth(app);
  if(app.options.projectId!==config.projectId||auth.emulatorConfig?.host!=='127.0.0.1'||auth.emulatorConfig.port!==9299)throw new Error('MIXED_INVENTORY_ENVIRONMENT');
  const db=initializeFirestore(app,{});connectFirestoreEmulator(db,'127.0.0.1',8386);
  const functions=getFunctions(app,'us-central1');connectFunctionsEmulator(functions,'127.0.0.1',5205);
  const call=httpsCallable(functions,'mutateInventoryCandidate',{timeout:15000});
  const reader=createCandidateReader(db,auth,LOCAL_AUTH_UID);
  return{...reader,async mutate(input){
    try{
      if(auth.currentUser?.uid!==LOCAL_AUTH_UID)throw{code:'permission-denied'};
      const command=parseCommand(structuredClone(input)),user=auth.currentUser;
      const response=(await call(command)).data as {status?:string;operationId?:string;productId?:string}|null;
      if(auth.currentUser!==user)throw{code:'permission-denied'};
      if(!response||!['confirmed','already-confirmed'].includes(response.status??'')||response.operationId!==command.operationId||response.productId!==command.productId)throw Error('INVALID_RECEIPT');
    }catch(error){
      if(error instanceof ContractError)throw new InventoryError('Revisa los datos y las cantidades del producto antes de guardarlo.');
      if(/INCOMPATIBLE_SCHEMA|INCOMPATIBLE_DOCUMENT/.test(String((error as {message?:unknown}|null)?.message??'')))throw new InventoryError('Estos productos necesitan una revisión antes de usarse. Pide ayuda para revisarlos.');
      throw inventoryError(error,true);
    }
  }};
}
