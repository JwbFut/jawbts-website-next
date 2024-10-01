"use client"

import EventBus from "@/components/eventBus";
import { fetchBase64, getDomesticApiUrl } from "@/components/serverActions";
import Utils from "@/components/utils";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export default function Page() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [imgUrl, setImgUrl] = useState("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYGAAAAAFAAGKM+MAAAAAAElFTkSuQmCC");

    const [curPlayingInfo, setCurPlayingInfo] = useState({ code: "unfinished", data: { title: "", author: "", cover: "" } });

    const e_callback = (info: any) => {
        setCurPlayingInfo(info);
    }
    EventBus.removeListener("musicPlayer_musicInfo", e_callback);
    EventBus.on("musicPlayer_musicInfo", e_callback);

    useEffect(() => {
        EventBus.emit("musicPlayer_requestMusicInfo");
    }, []);

    useEffect(() => {
        const f = async () => {
            if (curPlayingInfo.code === "unfinished" || !curPlayingInfo.data.cover) return;
            const s = await getDomesticApiUrl(cookie.token) + "/net/proxy?url=" + curPlayingInfo.data.cover + "&token=" + cookie.token;
            setImgUrl(s);
        };
        f();
    }, [curPlayingInfo]);

    return (
        <div className="box-border m-10 mb-15">
            <div className="flex justify-center w-full">
                <img
                    src={imgUrl}
                    alt="img"
                    width={curPlayingInfo.code == "unfinished" ? 0 : 600}
                    height={curPlayingInfo.code == "unfinished" ? 0 : 600}
                />

            </div>
            <div className="text-center text-gray-200 pt-5 w-full">
                <p>{curPlayingInfo.code === "unfinished" ? "" : curPlayingInfo.data?.title}</p>
                <p>{curPlayingInfo.code === "unfinished" ? "" : curPlayingInfo.data?.author}</p>
            </div>
            <div className="w-full flex justify-center pt-5 gap-5">
                <div>
                    <Link href="/nav/music/add">
                        <PlusIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer"></PlusIcon>
                    </Link>
                </div>
                <div>
                    <Link href="/nav/music/modify">
                        <PencilSquareIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer"></PencilSquareIcon>
                    </Link>
                </div>
            </div>
        </div>
    );
}