"use client"

import banner_styles from "@/app/banner_styles.module.css";
import { FormEvent, useEffect, useState } from "react";
import { getBannerText, submitLoginForm } from "@/components/logic/serverActions";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import Image from "next/image";
import Link from "next/link";
import LoadingMessageProvider from "@/components/utils/loadingMessageProvider";

export default function Home() {
    const [bannerText, setBannerText] = useState({
        data: {
            a: "Loading...",
            b: "加载中......",
        }
    });
    const [bgId, setBgId] = useState(-1);
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
            if (!banner_text.data || !banner_text.data.a) {
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

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
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

    // loading animation
    const [loadStage, setLoadStage] = useState(0);
    const [loadMessage, setLoadMessage] = useState("");
    const [loadError, setLoadError] = useState(false);

    const lmp = new LoadingMessageProvider(["正在加载中，请稍候...", "正在获取背景图片...", "你网络不是那么好, huh?"]);

    useEffect(() => {
        if (loadStage == 0) {
            const interval = setInterval(() => {
                if (loadError || loadStage > 0) {
                    clearInterval(interval);
                    return;
                }
                setLoadMessage(lmp.getMessage());
            }, 100);
            return () => {
                clearInterval(interval);
            }
        }
    }, [loadStage]);

    return (
        <div className="bg-cover w-screen h-screen relative overflow-hidden">
            {/* loading screen */}
            <div className={`fixed inset-0 flex flex-col items-center justify-center transition-all duration-500 ${loadStage > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {!loadError && <div className="animate-pulse text-gray-500 mb-4">{loadMessage}</div>}
            </div>

            {/* background image */}
            {bgId != -1 &&
                <Image
                    src={`https://cdn.jawbts.org/photos/ocean-${bgId}.webp`}
                    alt="Background"
                    fill
                    className={`object-cover transition-opacity duration-1000 ${loadStage > 1 ? 'opacity-100' : 'opacity-0'}`}
                    priority
                    quality={100}
                    onLoad={() => {
                        setLoadStage(1);
                        setTimeout(() => setLoadStage(2), 500);
                    }}
                    onError={() => {
                        setLoadError(true);
                        setLoadStage(2);
                    }}
                />
            }

            {/* banner text and form */}
            <div className="text-center absolute m-auto inset-x-0 inset-y-0 w-1/2 h-1/2">
                <div className={banner_styles.div}>
                    <header className={`${banner_styles.border} transition-all duration-500 ${loadStage < 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <h1 className="animate-logo-brightness tracking-wider text-[#80f4fa] text-5xl md:text-6xl font-black my-2 text-nowrap inline-block">J a w b t s</h1>
                    </header>
                    <div className="transition text-[rgba(255,255,255,0)] hover:text-[rgba(255,255,255,1)]">
                        <p>{bannerText.data.a}</p>
                        <p>{bannerText.data.b}</p>
                    </div>
                    <footer className={`transition my-5 text-[rgba(255,255,255,0)] hover:text-[rgba(255,255,255,1)] ${loadStage < 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}"`}>
                        {error && <div style={{ color: 'red' }}>{error}</div>}
                        <form onSubmit={onSubmit}>
                            <input className="my-5 bg-[rgba(0,0,0,0)] text-center" type="text" name="username" autoComplete="username" disabled={loading} hidden={cookieExist}></input> <br />
                            <button className="transition border-2 border-[rgba(0,0,0,0)] hover:border-white h-10 w-20 text-lg"
                                type="submit" disabled={loading} hidden={cookieExist}>
                                {loading ? "加载中..." : "登录"}
                            </button>
                            <Link className="my-15 text-lg" href="/nav" hidden={!cookieExist}>进入</Link>
                        </form>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                @keyframes logoBrightness {
                  0% { filter: brightness(1); }
                  50% { filter: brightness(1.2); }
                  100% { filter: brightness(1); }
                }
                
                .animate-logo-brightness {
                  animation: logoBrightness 0.8s ease-in-out;
                }`}
            </style>
        </div>
    );
}