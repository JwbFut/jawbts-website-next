import { NextRequest, NextResponse } from "next/server"
import AuthUtils from "@/components/utils/authUtils";

export async function middleware(request: NextRequest) {
    const res = await AuthUtils.checkAuth();
    if (res === 0) {
        return NextResponse.redirect(new URL("/auth/logout?no_cd=true", request.url));
    }
    if (res === 1) {
        return NextResponse.next();
    }
    if (res === 2) {
        return NextResponse.redirect(new URL(`/auth/refresh?redirect_url=${request.url}`, request.url));
    }
}

export const config = {
    matcher: '/nav/:path*',
}