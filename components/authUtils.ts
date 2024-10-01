"use server"

import { cookies } from "next/headers";
import * as jose from "jose"
export const jwks = jose.createRemoteJWKSet(new URL(process.env.API_URL + "/auth/keys"));

export default class AuthUtils {
    /**
     * 服务端的
     * @returns 登录信息是否有效
     * 0 -> 无效; 1 -> 有效; 2 -> 过期
     */
    static async checkAuth(first_try: boolean = true): Promise<number> {
        const cookieStorage = cookies();
        let token = cookieStorage.get("token")?.value;
        let username = cookieStorage.get("username")?.value;
        if (!token || !username) return 0;

        try {
            const { payload } = await jose.jwtVerify(token, jwks, {
                issuer: 'jawbts-api',
                audience: username,
            });
            if (!payload.scope) return 0;
            if (!(payload.scope instanceof Array)) return 0;
            return payload.scope.includes("website") ? 1 : 0;
        } catch(err) {
            if ((err as Error).message === '"exp" claim timestamp check failed') {
                return 2;
            }
            if ((err as Error).message === 'request timed out' && first_try) {
                return await this.checkAuth(false);
            }
            return 0;
        }
    }
}