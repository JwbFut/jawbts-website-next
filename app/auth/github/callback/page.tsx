"use client"

import { verifyGithubLoginRedirect } from "@/components/serverActions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [ cookie, setCookie ] = useCookies(["token", "username", "client_id"]);

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const [ mes, setMes ] = useState("Verifying your token...");

    if (!code || !state) {
        useEffect(() => {
            setMes("Cant find code / state param. Will Redirect to login page in 12s.");
            setTimeout(() => router.push("/"), 12000);
        }, [code, state]);
    } else {
        let call_flag = false;
        useEffect(() => {
            const verify = async function () {
                try {
                    let res = await verifyGithubLoginRedirect(state, code);
                    if (res.code != "Success") {
                        // console.log(res.code + (res.reason ? res.reason : "") + " Will Redirect to login page in 12s.");
                        setMes(res.code + ". " + (res.data?.reason ? res.data.reason : "") + " Will Redirect to login page in 12s.");
                        setTimeout(() => router.push("/"), 12000);
                    } else {
                        let expire_date = new Date(9999, 1);
                        setCookie("token", res.data.jwt, { expires: expire_date, sameSite: "lax", path: "/" });
                        setCookie("username", res.data.username, { expires: expire_date, sameSite: "lax", path: "/" });
                        setCookie("client_id", res.data.client_id, { expires: expire_date, sameSite: "lax", path: "/" });
                        localStorage.setItem("ref_token", res.data.ref_token);
                        
                        setMes("Redirecting.");
                        router.push("/nav");
                    }
                } catch(err) {
                    setMes((err as Error).message + " Will Redirect to login page in 12s.");
                    setTimeout(() => router.push("/"), 12000);
                }
            }

            if (!call_flag) {
                verify();
                call_flag = true;
            }
        }, [code, state]);
    }

    return (
        <div className="absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2 text-gray-100 text-center text-xl">
            Github Login Redirect Page. <br /><br />
            {mes}
        </div>
    );
}