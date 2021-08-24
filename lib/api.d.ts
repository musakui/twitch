type API = (path: string, data?: object) => Promise<object>
declare function create(token: string): API
