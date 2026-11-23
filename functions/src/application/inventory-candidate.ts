import { createHash } from 'node:crypto';
import { applyCommand, ContractError, fromDocument, parseCommand, stable, toDocument, type Product } from '@mi-casa/inventory-contract';
import { authorize, type Identity } from './executor.js';
import type { OperationRepository } from './repository.js';
import { ConflictError, ensure } from '../experimental/validation.js';

export function createCandidateExecutor(repositoryFor:(uid:string)=>OperationRepository,allowedUid:string) {
  return async (auth:Identity,input:unknown)=>{
    const uid=authorize(auth,allowedUid);
    ensure(Buffer.byteLength(JSON.stringify({data:input}))<=8192,'REQUEST_TOO_LARGE');
    const command=parseCommand(structuredClone(input));
    const hash=createHash('sha256').update(stable(command)).digest('hex');
    return repositoryFor(uid).transaction(async tx=>{
      const existing=await tx.findOperation(command.operationId);
      if(existing){
        if(existing.intentHash!==hash)throw new ConflictError('IDEMPOTENCY_CONFLICT');
        return{status:'already-confirmed',operationId:command.operationId,productId:command.productId};
      }
      const originals=await tx.readProducts([command.productId]);
      const raw=originals.get(command.productId),now=tx.now();
      let before:Product|null=null;
      if(raw!=null){
        try{before=fromDocument(command.productId,raw,t=>(t as {toMillis():number}).toMillis());}
        catch(error){throw new ContractError(error instanceof ContractError&&error.code==='INCOMPATIBLE_SCHEMA'?'INCOMPATIBLE_SCHEMA':'INCOMPATIBLE_DOCUMENT');}
      }
      const after=applyCommand(command,before,now.toMillis());
      const amount=(p:Product)=>p.control==='exact'?p.stock.quantityMilli:p.stock.status;
      tx.writeProduct(command.productId,toDocument(after,()=>now),raw!=null);
      tx.createOperation({schemaVersion:1,operationId:command.operationId,kind:'inventoryCandidate',productId:command.productId,command,
        intentHash:hash,createdAt:now,productIds:[command.productId],
        movements:command.kind==='edit'?[]:[{id:command.operationId,productId:command.productId,kind:'adjustment',unit:after.baseUnit,
          before:before?amount(before):null,after:amount(after)}]});
      return{status:'confirmed',operationId:command.operationId,productId:command.productId};
    });
  };
}
