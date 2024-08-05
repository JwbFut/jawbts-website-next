"use client"

import { refreshJwt } from "@/components/serverActions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const [ mes, setMes ] = useState("Refreshing your token...");
    const router = useRouter();
    const [ cookie, setCookie ] = useCookies(["username", "token", "client_id"]);
    const redirect_url = useSearchParams().get("redirect_url");

    let expire_date = new Date();
    expire_date.setDate(expire_date.getDate() - 1);

    function rm_token_and_redirect() {
        setCookie("token", "111", { expires: expire_date, sameSite: "lax", path: "/" });
        setCookie("username", "111", { expires: expire_date, sameSite: "lax", path: "/" });
        setCookie("client_id", "111", { expires: expire_date, sameSite: "lax", path: "/" });
        setTimeout(() => router.push("/"), 12000);
    }

    let call_flag = false;
    useEffect(() => {
        const ref_token = localStorage.getItem("ref_token");
        if (!ref_token) {
            setMes("Cant find refresh token.  Will Redirect to login page in 12s.");
            rm_token_and_redirect();
            return;
        }

        const username = cookie.username;
        if (!username) {
            setMes("Cant find username.  Will Redirect to login page in 12s.");
            rm_token_and_redirect();
            return;
        }

        const refresh = async function () {
            try {
                let res = await refreshJwt(ref_token, username);
                if (res.code != "Success") {
                    setMes(res.code + ". " + (res.data?.reason ? res.data.reason : "") + " Will Redirect to login page in 12s.");
                    rm_token_and_redirect();
                } else {
                    let expire_date = new Date(9999, 1);
                    setCookie("token", res.data.jwt, { expires: expire_date, sameSite: "lax", path: "/" });
                    setCookie("username", res.data.username, { expires: expire_date, sameSite: "lax", path: "/" });
                    
                    setMes("Redirecting...");
                    router.push(redirect_url ? redirect_url : "/nav");
                }
            } catch(err) {
                setMes((err as Error).message + " Will Redirect to login page in 12s.");
                rm_token_and_redirect();
            }
        }

        if (!call_flag) {
            refresh();
            call_flag = true;
        }
    }, []);

    return (
        <div className="absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2 text-gray-100 text-center text-xl">
            Token Refresh Page. <br /><br />
            {mes}
        </div>
    );
}