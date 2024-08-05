"use client"

import { getProfile, submitProfileEditForm } from "@/components/serverActions";
import Utils from "@/components/utils";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [profile, setProfile] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [avatarUrl_e, setAvatarUrl_e] = useState("");
    const [description_e, setDescription_e] = useState("");

    function proc_profile() {
        if (!profile) return {
            "id": "unknown",
            "username": "unknown",
            "avatar_url": "https://cdn.jawbts.org/photos/logo.png",
            "description": "",
            "ref_tokens": [
            ]
        }
        return profile["data"];
    }

    useEffect(() => {
        const getP_c = async () => {
            let p = await getProfile(cookie.token)
            setProfile(p);
            setAvatarUrl_e(p["data"]["avatar_url"]);
            setDescription_e(p["data"]["description"]);
            setLoading(false);
        }

        getP_c();
    }, [loading])

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        try {
            setLoading(true);
            setError("");
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            let avatar_url = formData.get("avatar_url")?.toString();
            let description = formData.get("description")?.toString();
            if (avatar_url == "") {
                avatar_url = undefined;
            }
            if (description == "") {
                description = undefined;
            }

            // 处理换行
            if (description) {
                description = description.replaceAll(/\n/g, "\\n");
            }

            const res = await submitProfileEditForm(cookie.token, avatar_url, description);
            if (res.code != "Success") {
                setError(res.data.reason);
            }
            setLoading(false);
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }

    return (
        <div className="box-border m-10 pb-5">
            <div className="flex flex-row gap-y-5 bg-[#313131] rounded-lg">
                <div className="basis-full">
                    <form onSubmit={onSubmit} className="my-5">
                        <input className="my-2 w-2/3 mx-5" type="text" name="avatar_url" disabled={loading} placeholder={avatarUrl_e}></input>
                        <textarea className="my-2 w-11/12 mx-5 text-wrap" name="description" rows={6} disabled={loading} placeholder={description_e.replaceAll(/(?<!\\)\\n/g, "\n")}></textarea>
                        <br />
                        <button className="border-2 h-10 w-20 text-lg text-[#f3f3f3] mx-5"
                            type="submit" disabled={loading}>
                            {loading ? "加载中..." : "提交"}
                        </button>
                    </form>
                </div>
                {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>
            <div className="grid grid-cols-3 gap-4 bg-[#313131] rounded-lg my-10">
                <div className="">
                    <Image
                        src={proc_profile()["avatar_url"]}
                        alt="avatar"
                        width={500}
                        height={500}
                        priority={true}
                        className="rounded-lg"
                    />
                </div>
                <div className="col-span-2">
                    <article className="pr-2 overflow-hidden">
                        <h1 className="text-[#f3f3f3] text-center m-2 lg:text-3xl lg:font-black text-xl font-bold">{proc_profile()["username"]}</h1>
                        <div className="text-[#f3f3f3] text-center m-2 text-base" dangerouslySetInnerHTML={{__html: Utils.escapeDescription(proc_profile()["description"])}}></div>
                        <p className="text-[#f3f3f3] text-center m-2 text-base">{proc_profile()["avatar_url"]}</p>
                    </article>
                </div>
            </div>
        </div>
    );
}