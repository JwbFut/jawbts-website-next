import MusicListModifier from "./musicListModifer";
import EventBus from "./eventBus";
import { use, useEffect, useState } from "react";
import { musicDataAsyncer } from "./asyncUtils";
import { ArrowPathIcon, ArrowsUpDownIcon, BarsArrowDownIcon } from "@heroicons/react/24/outline";

const f_callback = (info: any) => {
    EventBus.emit("musicListModifier_setSelectedMusic", info.data);
}

export default function MusicPlayingSettings() {
    const [volume, setVolume] = useState(100);
    const [lastChangeTime, setLastChangeTime] = useState(0);
    const [playingMode, setPlayingMode] = useState("single_loop");
    const modes = ["single_loop", "shuffle", "list_loop"];
    const [delay, setDelay] = useState(-1);

    let config: any = null;
    if (typeof window !== "undefined" && window.localStorage) config = JSON.parse(localStorage.getItem("musicPlayerConfig") || JSON.stringify({ volume: 100, playingMode: "single_loop", delay: 0 }));

    useEffect(() => {
        setVolume(config.volume);
        setDelay(config.delay);
        setPlayingMode(config.playingMode);

        let localMusicList: any[] = musicDataAsyncer.get();
        EventBus.emit("musicListModifier_updateMusicList", localMusicList);

        EventBus.removeListener("musicPlayer_musicInfo", f_callback);
        EventBus.on("musicPlayer_musicInfo", f_callback);

        EventBus.emit("musicPlayer_requestMusicInfo");

        EventBus.emit("musicPlayer_setVolume", config.volume);
    }, []);

    function changeVolumn(e: number) {
        if (!config) return;

        let k = e;
        if (Date.now() - lastChangeTime < 200) {
            k *= 10;
        }
        setLastChangeTime(Date.now());
        let f = volume + k;
        if (f < 0) f = 0;
        if (f > 100) f = 100;
        setVolume(f);
        EventBus.emit("musicPlayer_setVolume", f);
        config.volume = f;
        onConfigChange();
    }

    useEffect(() => {
        if (delay < 0) return;
        config.delay = delay;
        onConfigChange();
    }, [delay]);

    function onConfigChange() {
        localStorage.setItem("musicPlayerConfig", JSON.stringify(config));
    }

    function changePlayingMode(mode: string) {
        if (!config) return;

        let index = modes.indexOf(mode);
        config.playingMode = modes[(index + 1) % modes.length];
        setPlayingMode(config.playingMode);
        onConfigChange();
    }

    const playingModeText = ["单曲循环", "随机播放", "列表循环"]
    function getPlayingModeText() {
        let index = modes.indexOf(playingMode);
        return playingModeText[index];
    }

    function getButton(mode: string) {
        switch (mode) {
            case "single_loop":
                return <ArrowPathIcon className="h-8 w-8 text-gray-300 group-hover:text-gray-200 cursor-pointer inline"
                    onClick={() => changePlayingMode("single_loop")}></ArrowPathIcon>;
            case "shuffle":
                return <ArrowsUpDownIcon className="h-8 w-8 text-gray-300 group-hover:text-gray-200 cursor-pointer inline"
                    onClick={() => changePlayingMode("shuffle")}></ArrowsUpDownIcon>;
            case "list_loop":
                return <BarsArrowDownIcon className="h-8 w-8 text-gray-300 group-hover:text-gray-200 cursor-pointer inline"
                    onClick={() => changePlayingMode("list_loop")}></BarsArrowDownIcon>;
            default:
                return <></>;
        }
    }

    return (
        <div className="bg-[#313131] rounded-lg mt-5 mb-40">
            <MusicListModifier enableInnerIdSelect={true} />
            <div className="grid grid-rows-1 grid-cols-12 text-gray-300 text-center select-none pb-10">
                <div className="col-span-1"></div>
                <div className="col-span-1 text-xl" onClick={() => changeVolumn(-1)}>
                    -
                </div>
                <div className="col-span-1 text-xl">
                    {volume} %
                </div>
                <div className="col-span-1 text-xl" onClick={() => changeVolumn(1)}>
                    +
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-1">
                    {
                        getButton(playingMode)
                    }
                </div>
                <div className="col-span-1">
                    {
                        getPlayingModeText()
                    }
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-1 text-xl" onClick={() => setDelay(Math.max(delay - 1, 0))}>
                    -
                </div>
                <div className="col-span-1 text-xl">
                    播放间隔: {delay} s
                </div>
                <div className="col-span-1 text-xl" onClick={() => setDelay(delay + 1)}>
                    +
                </div>
                <div className="col-span-1"></div>
            </div>
        </div>
    )
}