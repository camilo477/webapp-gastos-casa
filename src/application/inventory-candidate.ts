import { CATEGORIES, CONTRACT, type Command, type Definition, type Product, type Quantity } from '@mi-casa/inventory-contract';
import type { InventoryProduct, LocalInventoryPort } from './inventory';
import type { InventoryReadPort } from './inventory-read';
import { ConfigurationError, type Configuration } from './configuration';

export type CandidateFormDetails = {presentation:string|null;quantity:Quantity};
export type CandidateSuggestion = {product:InventoryProduct;reason:'same'|'presentation'|'possible'|'incompatible'};
export interface CandidateReadPort extends InventoryReadPort {
  readonly contract:typeof CONTRACT;
  suggest(definition:Definition,excludeId?:string):Promise<{items:CandidateSuggestion[];incomplete:boolean}>;
}
export interface CandidateInventoryPort extends CandidateReadPort { mutate(command:Command):Promise<void> }
export type InventoryService = LocalInventoryPort | CandidateInventoryPort;
export function isCandidate(service:object):service is CandidateReadPort { return 'contract'in service&&service.contract===CONTRACT; }
export function isCandidateWriter(service:InventoryService):service is CandidateInventoryPort {return isCandidate(service);}
export function candidateView(p:Product):InventoryProduct {
  const common={id:p.id,name:p.name,presentation:p.presentation,category:CATEGORIES[p.categoryId],unit:p.baseUnit,version:p.version,updatedAtMillis:p.updatedAt};
  return p.control==='exact'?{...common,control:'exact',quantityMilli:p.stock.quantityMilli}:{...common,control:'simple',status:p.stock.status};
}
export function candidateCategory(label:string):keyof typeof CATEGORIES {
  const key=(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).find(k=>CATEGORIES[k]===label);
  if(!key)throw new Error('INVALID_CATEGORY');return key;
}
export function inventoryProfile(configuration:Configuration,env:Readonly<Record<string,unknown>>):'candidate'|'legacy'|null {
  const profile=env.VITE_INVENTORY_CONTRACT;
  if(configuration.mode!=='emulator'){
    if(profile!==undefined)throw new ConfigurationError('LOCAL_INVENTORY_PROFILE_ONLY');return null;
  }
  if(profile===undefined||profile===CONTRACT)return'candidate';
  if(profile==='experimental-05c1')return'legacy';
  throw new ConfigurationError('INVALID_INVENTORY_PROFILE');
}
