"use client"

import banner_styles from "@/app/banner_styles.module.css";
import { FormEvent, useEffect, useState } from "react";
import { getBannerText, submitLoginForm } from "@/components/serverActions";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import Link from "next/link";

export default function Home() {
    const [bannerText, setBannerText] = useState({
        data: {
            a: "Loading...",
            b: "加载中......",
        }
    });
    const [bgId, setBgId] = useState(2);
    const [cookie, setCookie] = useCookies(["token", "client_id", "username"]);
    const [cookieExist, setCookieExist] = useState(false);

    useEffect(() => {
        // logout的原理是让cookie expire. 但是有bug, cookie不一定马上会expire, 所以要防一下.
        if (cookie.token && cookie.token.length > 5) {
            setCookieExist(true);
        }
    }, [cookie.token]);

    const router = useRouter();

    useEffect(() => {
        setBgId(Math.round(Math.random() * 4) + 1);

        const get_banner_text = async () => {
            let banner_text = await getBannerText();
            if (banner_text instanceof Error) {
                console.log("[ERROR] Fectch failed.");
                console.log(banner_text);

                setBannerText({
                    data: {
                        a: "Sorry, We Met Some Problem",
                        b: "API Unreachable",
                    }
                });

                return;
            }
            setBannerText(banner_text);
        }

        get_banner_text();
    }, []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmid(event: FormEvent<HTMLFormElement>) {
        try {
            setLoading(true);
            setError("");
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            const username = formData.get("username")?.toString();
            if (!username) {
                setError("'username' not exists in the form. Did u fill it?");
                setLoading(false);
                return;
            }

            if (username.includes("@")) {
                let strs = username.split("@");
                if (strs.length != 3) {
                    setError("format of 'username' is not correct.");
                    setLoading(false);
                    return;
                }

                let expire_date = new Date(9999, 1);
                setCookie("token", "thisisatokenbelieveme", { expires: expire_date, sameSite: "lax", path: "/" });
                setCookie("username", strs[0], { expires: expire_date, sameSite: "lax", path: "/" });
                setCookie("client_id", strs[1], { expires: expire_date, sameSite: "lax", path: "/" });
                localStorage.setItem("ref_token", strs[2]);

                setLoading(false);
                router.push("/auth/refresh");

                return;
            }

            const res = await submitLoginForm(username, window.navigator.userAgent);
            if (res.code != "Success") {
                setError(res.data.reason);
                setLoading(false);
                return;
            }
            router.push(res.data.url);
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }

    return (
        <div className="bg-cover w-screen h-screen bg-center object-center relative"
            style={{ backgroundImage: `url(https://cdn.jawbts.org/photos/ocean-${bgId}.webp)` }}
        >
            <div className="text-center absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2">
                <div className={banner_styles.div}>
                    <header className={banner_styles.border}>
                        <h1 className="tracking-wider text-[#80f4fa] text-2xl md:text-6xl font-black my-2 text-nowrap inline-block">J a w b t s</h1>
                    </header>
                    <div className="transition text-[rgba(255,255,255,0)] hover:text-[rgba(255,255,255,1)]">
                        <p>{bannerText.data.a}</p>
                        <p>{bannerText.data.b}</p>
                    </div>
                    <footer className="transition my-5 text-[rgba(255,255,255,0)] hover:text-[rgba(255,255,255,1)]">
                        {error && <div style={{ color: 'red' }}>{error}</div>}
                        <form onSubmit={onSubmid}>
                            <input className="my-5 bg-[rgba(0,0,0,0)] text-center" type="password" name="username" autoComplete="password" disabled={cookieExist || loading}></input> <br />
                            <button className="transition border-2 border-[rgba(0,0,0,0)] hover:border-white h-10 w-20 text-lg"
                                type="submit" disabled={loading} hidden={cookieExist}>
                                {loading ? "加载中..." : "登录"}
                            </button>
                            <Link className="my-15 text-lg" href="/nav" hidden={!cookieExist}>进入</Link>
                        </form>
                    </footer>
                </div>
            </div>
        </div>
    );
}