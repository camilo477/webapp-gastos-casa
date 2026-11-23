import { expect,type Page } from '@playwright/test';
export const fixture={project:'mi-casa-camilo-test',uid:'release-owner-fixture',email:'read-release@example.test',password:'Ficticia-solo-mocks!'};
export async function mockReadServices(page:Page){
 const state={reads:0,refreshes:0,denied:false,unavailable:false,expired:false};
 const jwt=()=>{
  const part=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url'),now=Math.floor(Date.now()/1000);
  return part({alg:'none',typ:'JWT'})+'.'+part({aud:fixture.project,iss:'https://securetoken.google.com/'+fixture.project,sub:fixture.uid,user_id:fixture.uid,iat:now,auth_time:now,exp:now+3600,email:fixture.email,firebase:{sign_in_provider:'password'}})+'.fixture';
 };
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin==='http://localhost:5175')return route.continue();
  if(url.hostname==='identitytoolkit.googleapis.com'){
   expect(url.searchParams.get('key')).toBe('fictitious-public-web-key-not-valid');
   if(url.pathname.endsWith('accounts:signInWithPassword'))return route.fulfill({json:{localId:fixture.uid,email:fixture.email,idToken:jwt(),refreshToken:'fictitious-refresh',expiresIn:'3600',registered:true}});
   if(url.pathname.endsWith('accounts:lookup'))return route.fulfill({json:{users:[{localId:fixture.uid,email:fixture.email,emailVerified:false,createdAt:'1',lastLoginAt:'1',providerUserInfo:[{providerId:'password',email:fixture.email,federatedId:fixture.email}]}]}});
  }
  if(url.hostname==='securetoken.googleapis.com'){
   expect(url.searchParams.get('key')).toBe('fictitious-public-web-key-not-valid');state.refreshes++;
   return state.expired?route.fulfill({status:400,json:{error:{message:'TOKEN_EXPIRED'}}}):route.fulfill({json:{access_token:jwt(),refresh_token:'fictitious-refresh',expires_in:'3600',token_type:'Bearer',user_id:fixture.uid,project_id:fixture.project}});
  }
  if(url.hostname==='firestore.googleapis.com'){
   const path=decodeURIComponent(url.pathname);
   expect(path).toContain('/projects/'+fixture.project+'/databases/(default)/documents/users/'+fixture.uid+':runQuery');
   expect(route.request().method()).toBe('POST');
   const query=route.request().postDataJSON().structuredQuery;expect(query.from).toEqual([{collectionId:'products'}]);expect(query.limit).toBe(100);state.reads++;
   if(state.unavailable)return route.abort('internetdisconnected');
   if(state.denied)return route.fulfill({status:403,json:{error:{code:403,message:'Permission denied',status:'PERMISSION_DENIED'}}});
   return route.fulfill({json:[{readTime:new Date().toISOString()}]});
  }
  await route.abort();throw Error('UNEXPECTED_SERVICE_BLOCKED_BEFORE_NETWORK');
 });
 return state;
}
export async function login(page:Page){
 await page.getByLabel('Correo electrónico').fill(fixture.email);await page.getByLabel('Contraseña',{exact:true}).fill(fixture.password);await page.getByRole('button',{name:'Ingresar',exact:true}).click();
}
export async function emptyInventory(page:Page){
 await expect(page.getByRole('heading',{name:'Todavía no tienes productos registrados',exact:true})).toBeVisible();
 await expect(page.getByText('Inventario de tu cuenta',{exact:true})).toBeVisible();await expect(page.getByText('Inventario del laboratorio local',{exact:true})).toHaveCount(0);
 await expect(page.locator('.inventory-item')).toHaveCount(0);await expect(page.getByRole('button',{name:/Añadir producto|Guardar producto|Guardar existencias/})).toHaveCount(0);
}
