import type { Auth } from 'firebase/auth';
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query, startAfter, terminate, where, type Firestore } from 'firebase/firestore/lite';
import { CATEGORIES, CONTRACT, fromDocument, normalize, suggestions, type Product } from '@mi-casa/inventory-contract';
import { candidateCategory, candidateView, type CandidateReadPort } from '../../application/inventory-candidate';
import { InventoryReadError, inventoryReadError } from '../../application/inventory-read';

export function createCandidateReader(db:Firestore,auth:Auth,ownerUid:string):CandidateReadPort {
  if(db.app!==auth.app||!ownerUid)throw new Error('MIXED_INVENTORY_READER_CONTEXT');
  let disposed=false;
  const identity=()=>{
    if(disposed||auth.currentUser?.uid!==ownerUid)throw new InventoryReadError('access','Tu sesión terminó o no tiene acceso al inventario.');
    return auth.currentUser;
  };
  const decode=(id:string,data:unknown)=>{
    try{return fromDocument(id,data,t=>(t as {toMillis():number}).toMillis());}
    catch{throw new InventoryReadError('contract','Estos productos necesitan una revisión antes de usarse. Pide ayuda para revisarlos.');}
  };
  async function records(cursor:string|null,category:string):Promise<{items:Product[];nextCursor:string|null}> {
    const user=identity();
    if(cursor!==null&&(typeof cursor!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(cursor)))throw new InventoryReadError('query','Vuelve a consultar los productos.');
    if(category!=='all'&&!Object.values(CATEGORIES).some(label=>label===category))throw new InventoryReadError('query','Elige una categoría del inventario.');
    const filter=category==='all'?[]:[where('categoryId','==',candidateCategory(category))];
    const result=await getDocs(query(collection(db,'users',user.uid,'products'),...filter,orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(100)));
    if(identity()!==user)throw new InventoryReadError('access','La sesión cambió. Vuelve a consultar los productos.');
    return{items:result.docs.map(d=>decode(d.id,d.data())),nextCursor:result.size===100?result.docs.at(-1)!.id:null};
  }
  return{
    contract:CONTRACT,
    async page({cursor,category,search}){
      try{
        const user=identity();
        if(typeof search!=='string'||search.length>160)throw new InventoryReadError('query','Revisa el nombre que quieres buscar.');
        const page=await records(cursor,category);
        if(identity()!==user)throw new InventoryReadError('access','La sesión cambió. Vuelve a consultar los productos.');
        return{items:page.items.filter(p=>normalize(p.name+' '+(p.presentation??'')).includes(normalize(search))).map(candidateView),nextCursor:page.nextCursor};
      }catch(error){throw inventoryReadError(error);}
    },
    async byId(id){
      try{
        const user=identity();if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(id))throw new InventoryReadError('query','No pudimos identificar ese producto.');
        const snapshot=await getDoc(doc(db,'users',user.uid,'products',id));
        if(identity()!==user)throw new InventoryReadError('access','La sesión cambió.');
        return snapshot.exists()?candidateView(decode(snapshot.id,snapshot.data())):null;
      }catch(error){throw inventoryReadError(error);}
    },
    async suggest(definition,excludeId){
      try{
        const user=identity();
        try{suggestions(definition,[]);}catch{throw new InventoryReadError('query','Revisa el nombre y la presentación del producto.');}
        let cursor:string|null=null;const all:Product[]=[];
        do{const page=await records(cursor,'all');all.push(...page.items);cursor=page.nextCursor;}while(cursor&&all.length<1000);
        if(identity()!==user)throw new InventoryReadError('access','La sesión cambió. Vuelve a consultar los productos.');
        return{items:suggestions(definition,all,excludeId).slice(0,8).map(s=>({product:candidateView(s.product),reason:s.reason})),incomplete:cursor!==null};
      }catch(error){throw inventoryReadError(error);}
    },
    async dispose(){disposed=true;await terminate(db);},
  };
}
