import { APIRequestContext, APIResponse } from '@playwright/test';
type RequestOptions = Parameters<APIRequestContext['post']>[1];
export declare function apiClient(request: APIRequestContext): {
    post(url: string, options?: RequestOptions): Promise<APIResponse>;
    get(url: string, options?: RequestOptions): Promise<APIResponse>;
    put(url: string, options?: RequestOptions): Promise<APIResponse>;
    delete(url: string, options?: RequestOptions): Promise<APIResponse>;
    patch(url: string, options?: RequestOptions): Promise<APIResponse>;
};
export {};
//# sourceMappingURL=apiClient.d.ts.map