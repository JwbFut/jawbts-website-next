"use client"

import { Redirecter } from "@/components/redirecter";
import { refreshJwt } from "@/components/serverActions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const [mes, setMes] = useState("Refreshing your token...");
    const [approved, setApproved] = useState(false);
    const [rejeced, setRejected] = useState(false);
    const router = useRouter();
    const [cookie, setCookie] = useCookies(["username", "token", "client_id"]);
    const redirect_url = useSearchParams().get("redirect_url");
    const [isError, setIsError] = useState(false);

    let expire_date = new Date();
    expire_date.setDate(expire_date.getDate() - 1);

    function rm_token() {
        setCookie("token", "111", { expires: expire_date, sameSite: "lax", path: "/" });
        setCookie("username", "111", { expires: expire_date, sameSite: "lax", path: "/" });
        setCookie("client_id", "111", { expires: expire_date, sameSite: "lax", path: "/" });
    }

    let call_flag = false;
    useEffect(() => {
        const ref_token = localStorage.getItem("ref_token");
        if (!ref_token) {
            setMes("Cant find refresh token.");
            setRejected(true);
            rm_token();
            return;
        }

        const username = cookie.username;
        if (!username) {
            setMes("Cant find username.");
            setRejected(true);
            rm_token();
            return;
        }

        const refresh = async function () {
            try {
                let hashed_ref_token = new Uint8Array(await window.crypto.subtle.digest("SHA-512", new TextEncoder().encode(ref_token + username)));
                let b64 = "";
                let len = hashed_ref_token.byteLength;
                for (let i = 0; i < len; i++) {
                    b64 += String.fromCharCode(hashed_ref_token[i]);
                }
                let res = await refreshJwt(encodeURIComponent(btoa(b64)), username);
                if (res.code != "Success") {
                    setMes(res.code + ". " + (res.data?.reason ? res.data.reason : ""));
                    setRejected(true);
                    rm_token();
                } else {
                    let expire_date = new Date(9999, 1);
                    setCookie("token", res.data.jwt, { expires: expire_date, sameSite: "lax", path: "/" });
                    setCookie("username", res.data.username, { expires: expire_date, sameSite: "lax", path: "/" });

                    setMes("Success");
                    setApproved(true);
                }
            } catch (err) {
                setMes((err as Error).name + ": " + (err as Error).message);
                setIsError(true);
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
            <Redirecter startCountdownApproved={approved} startCountdownRejeced={rejeced} urlApproved={redirect_url ? redirect_url : "/nav"}
                urlRejected={"/"} reason={mes} error={isError} />
        </div>
    );
}