"use client"

import { fetchApiGet, getProfile, removeRefreshToken } from "@/components/serverActions";
import Utils from "@/components/utils";
import Image from "next/image";
import { MouseEvent, use, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { generateQRCode } from "@/components/serverActionsJS";

export default function Page() {
    const [cookie, setCookie] = useCookies(["username", "token", "client_id"]);
    const [profile, setProfile] = useState({
        "id": "Loading...",
        "username": "Loading...",
        "avatar_url": Utils.nonePNG,
        "description": "",
        "ref_tokens": [
            {
                "scope": [
                    "Loading...",
                ],
                "desc_c": "Loading...",
                "state_c": "Loading...",
                "exp_time": new Date().toISOString(),
                "ref_token": null
            },
        ]
    });
    const [rTLoading, setRTLoading] = useState(false);
    const [qRLoading, setQRLoading] = useState(false);
    const [clientId, setClientId] = useState("Loading...");

    async function remove_token(event: MouseEvent<HTMLButtonElement>) {
        setRTLoading(true);
        try {
            event.preventDefault();
            await removeRefreshToken(cookie.token, event.currentTarget.name);
            const p = (await getProfile(cookie.token))["data"];
            if (p) setProfile(p);
            setRTLoading(false);
        } catch (e) {
            console.log(e);
            setRTLoading(false);
        }
    }

    const [qrCodeBase64, setQrCodeBase64] = useState("");
    const [qRError, setQRError] = useState("");
    async function getQRCode(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        setQRError("");
        setQRLoading(true);
        try {
            const res = await fetchApiGet("auth/otp", cookie.token);
            if (res.code != "Success") {
                setQRLoading(false);
                setQRError(res.data.reason);
                return;
            }
            window.navigator.clipboard.writeText(res.data.url);
            setQrCodeBase64(await generateQRCode(res.data.url));
        } catch (e) {
            setQRError((e as Error).message);
        }

        setQRLoading(false);
    }

    useEffect(() => {
        setClientId(cookie.client_id);
        const getP_c = async () => {
            setRTLoading(true);
            try {
                const p = (await getProfile(cookie.token))["data"];
                if (p) setProfile(p);
                setRTLoading(false);
            } catch (e) {
                console.log(e);
                setRTLoading(false);
            }
        }

        getP_c();
    }, []);

    return (
        <div className="box-border m-10">
            <div className="flex bg-[#313131] rounded-lg">
                <div className="basis-1/3">
                    <Image
                        src={profile["avatar_url"]}
                        alt="avatar"
                        width={500}
                        height={500}
                        priority={true}
                        className="rounded-lg"
                    />
                </div>
                <div className="basis-2/3">
                    <h1 className="text-[#f3f3f3] text-center m-2 lg:text-3xl lg:font-black text-xl font-bold">{profile["username"]}</h1>
                    <div className="text-[#f3f3f3] text-center m-2 text-base" dangerouslySetInnerHTML={{ __html: Utils.escapeDescription(profile["description"]) }}></div>
                    <h1 className="text-[#f3f3f3] text-center m-2 text-base">Your current client id: {clientId}</h1>
                </div>
            </div>
            <div className="grid auto-rows-auto grid-cols-1 sm:grid-cols-3 bg-[#313131] rounded-lg my-10 text-center">
                {profile["ref_tokens"].map((token) => (
                    <div className="m-5" key={token.desc_c + "D"}>
                        <h3 className="text-[#f3f3f3]" key={token.desc_c + "A"}>{token.desc_c}</h3>
                        <p className="text-[#f3f3f3]" key={token.desc_c + "B"}>Scope: {token.scope.toString()}</p>
                        <p className="text-[#f3f3f3]" key={token.desc_c + "C"}>Expire in: {Math.ceil((Date.parse(token.exp_time) - Date.now()) / (1000 * 3600 * 24))} days</p>
                        <button className="border-2 my-3 h-8 w-16 text-lg text-[#f3f3f3] mx-5"
                            onClick={remove_token} key={token.desc_c} name={token.desc_c} disabled={rTLoading}>
                            吊销
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex bg-[#313131] rounded-lg my-10 text-center">
                <div className="basis-1/3">
                    <img src={qrCodeBase64.length > 0 ? qrCodeBase64 : Utils.nonePNG}
                        width={200}
                    ></img>
                </div>
                <div className="basis-2/3">
                    <h3 className="text-[#f3f3f3] w-full text-center my-3 text-xl font-semibold">一次性密码</h3>
                    <p className="text-[#f3f3f3]">扫码登录, 一分钟后失效; 同时自动复制到剪贴板, 打开那个链接也行</p>
                    <button className="border-2 my-3 h-8 w-16 text-lg text-[#f3f3f3] mx-5"
                        onClick={getQRCode} disabled={qRLoading}>
                        获取
                    </button>
                    {qRError && <div style={{ color: 'red' }}>{qRError}</div>}
                </div>
            </div>
        </div>
    );
}