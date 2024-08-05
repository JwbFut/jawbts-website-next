"use client"

import { removeRefreshToken } from "@/components/serverActions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const router = useRouter();
    const params = useSearchParams();
    const [count, setCount] = useState(3);
    const [cookie, setCookie] = useCookies(["username", "token", "client_id"]);
    const [message, setMessage] = useState("");

    let no_cd = false;
    if (params.get("no_cd") == "true") {
        no_cd = true;
    }

    let call_flag = false;
    useEffect(() => {
        let expire_date = new Date();
        expire_date.setDate(expire_date.getDate() - 1);

        const revoke = async () => {
            try {
                let res = await removeRefreshToken(cookie.token, cookie.client_id);
                if (res.code == "Success") {
                    setCookie("token", "111", { expires: expire_date, sameSite: "lax", path: "/" });
                    setCookie("username", "111", { expires: expire_date, sameSite: "lax", path: "/" });
                    setCookie("client_id", "111", { expires: expire_date, sameSite: "lax", path: "/" });

                    if (!no_cd) {
                        setTimeout(() => router.push("/"), 3000);
                        setTimeout(() => setCount(2), 1000);
                        setTimeout(() => setCount(1), 2000);
                    } else {
                        router.push("/");
                    }
                } else {
                    if (typeof res != "string") res = JSON.stringify(res);
                    setMessage(res);
                    setCount(-1);
                }
            } catch(e) {
                setMessage((e as Error).message);
                setCount(-1);
            }
        }
        if (!call_flag) {
            call_flag = true;
            revoke();
        }
    }, []);

    return (
        <div className="absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2 text-gray-100 text-center text-xl">
            Log out Page. <br /><br />
            Will redirect in {count}s...
            <br /><br />
            <p className="text-red-600">{message}{message ? ". Please refresh the page to retry." : ""}</p>
        </div>
    );
}