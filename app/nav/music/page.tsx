"use client"

import EventBus from "@/components/logic/eventBus";
import MusicPlayingSettings from "@/components/ui/musicPlayingSettings";
import { getDomesticApiUrl } from "@/components/logic/serverActions";
import Utils from "@/components/utils/utils";
import { PencilSquareIcon, PlusIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

const e_callback = (value: any) => {
    EventBus.emit("musicPlayerPage_musicInfo", value);
}

export default function Page() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [imgUrl, setImgUrl] = useState(Utils.nonePNG);

    const [curPlayingInfo, setCurPlayingInfo] = useState({ code: "unfinished", data: { title: "", author: "", cover: "" } });

    useEffect(() => {
        EventBus.removeListener("musicPlayer_musicInfo", e_callback);
        EventBus.on("musicPlayer_musicInfo", e_callback);
        EventBus.removeAllListeners("musicPlayerPage_musicInfo");
        EventBus.on("musicPlayerPage_musicInfo", (value: any) => {
            if (value.excludeId == "mainPage") return;
            setCurPlayingInfo(value);
        });

        EventBus.emit("musicPlayer_requestMusicInfo");
    }, []);

    useEffect(() => {
        const f = async () => {
            if (!curPlayingInfo || curPlayingInfo.code === "unfinished" || !curPlayingInfo.data.cover) return;
            const s = await getDomesticApiUrl(cookie.token) + "/net/proxy?url=" + curPlayingInfo.data.cover + "&token=" + cookie.token;
            setImgUrl(s);
        };
        f();
    }, [curPlayingInfo]);

    const [playingSettingsExpanded, setPlayingSettingsExpanded] = useState(false);

    return (
        <div className="box-border m-6 pb-20">
            <div className="flex justify-center w-full">
                <img
                    src={imgUrl}
                    alt="Music Cover"
                    width={curPlayingInfo?.code == "unfinished" ? 0 : 600}
                    height={curPlayingInfo?.code == "unfinished" ? 0 : 300}
                />
            </div>
            <div className="text-center text-gray-200 pt-5 pb-3 w-full">
                <p>{curPlayingInfo?.code === "unfinished" ? "" : curPlayingInfo?.data?.title}</p>
                <p>{curPlayingInfo?.code === "unfinished" ? "" : curPlayingInfo?.data?.author}</p>
            </div>
            <div className="w-full flex justify-center px-5 gap-5">
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
                <div>
                    <Cog6ToothIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer"
                        onClick={() => setPlayingSettingsExpanded(!playingSettingsExpanded)}
                    ></Cog6ToothIcon>
                </div>
            </div>
            <MusicPlayingSettings visible={playingSettingsExpanded} />
        </div>
    );
}