type API = (path: string, params?: object, post?: object | boolean) => Promise<object>
declare function create(token: string, clientId: string): API
