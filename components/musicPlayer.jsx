"use client"

import music_player from "@/components/music_player.module.css"
import {
    PlayIcon,
    PauseIcon
} from '@heroicons/react/24/outline';
import { use, useEffect, useRef, useState } from 'react';
import { getApiUrl, getDomesticApiUrl } from "./serverActions";
import { useCookies } from "react-cookie";
import Utils from "./utils";
import EventBus from "./eventBus";
import { musicDataAsyncer } from "./asyncUtils";

export default function MusicPlayer() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [playing, setPlaying] = useState(false);
    const [barWidth, setBarWidth] = useState(0);
    const [progressSt, setProgressSt] = useState(0);
    const [curPlayingId, setCurPlayingId] = useState("###");
    const [localMusicList, setLocalMusicList] = useState([]);
    const [curPlayingInfo, setCurPlayingInfo] = useState({
        code: "unfinished",
        data: {
            title: "未知歌曲",
            author: "未知歌手",
            cover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYGAAAAAFAAGKM+MAAAAAAElFTkSuQmCC",
            inner_id: "###",
        },
        paused: true,
    });
    const [infoChangeCuzReload, setInfoChangeCuzReload] = useState(false);
    const progressBarRef = useRef(null);
    const audioRef = useRef(null);

    const [delay, setDelay] = useState(0);

    let callFlag_musicDataAsyncer = false;
    // 同步先
    useEffect(() => {
        const f = () => {
            musicDataAsyncer.checkAndAsync(cookie.token);
        }
        if (!callFlag_musicDataAsyncer) {
            f();
            callFlag_musicDataAsyncer = true;
        }
    }, []);

    useEffect(() => {
        setLocalMusicList(musicDataAsyncer.get());
        if (window) window.setInterval(() => {
            setLocalMusicList(musicDataAsyncer.get());
        }, 10000);
    }, []);

    let progress = 0, progressBarLength = 1, slideBeginX = 0, progressBegin = 0;

    let playing_temp;
    // 进度条逻辑
    function onMouseDown(e) {
        e.preventDefault();
        playing_temp = !audioRef.current.paused;
        audioRef.current.pause();

        slideBeginX = e.clientX;
        progressBegin = progressSt;
        if (progressBarRef.current) progressBarLength = progressBarRef.current["offsetWidth"];
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
        progress = (progressBegin * progressBarLength + e.clientX - slideBeginX) / progressBarLength;
        progress = progress < 0 ? 0 : progress;
        progress = progress > 1 ? 1 : progress;
        setBarWidth(progress);
    }

    function onMouseUp() {
        setProgressSt(progress);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (playing_temp) audioRef.current.play();
        if (!Number.isFinite(audioRef.current.duration)) return;
        audioRef.current.currentTime = audioRef.current.duration * progress;
    }

    // 播放信息同步逻辑
    EventBus.removeAllListeners("musicPlayer_requestMusicInfo");
    EventBus.on("musicPlayer_requestMusicInfo", (excludeId) => {
        let k = curPlayingInfo;
        k.excludeId = excludeId;
        EventBus.emit("musicPlayer_musicInfo", k);
    });

    useEffect(() => {
        let k = JSON.parse(JSON.stringify(curPlayingInfo));
        k.paused = !playing;
        setCurPlayingInfo(k);
    }, [playing]);

    // 播放逻辑
    const [firstCall, setFirstCall] = useState(true);
    useEffect(() => {
        if (curPlayingId === "###") {
            if (!localStorage) return;
            let musicInfo = localStorage.getItem("musicPlayerInfo");
            if (!musicInfo) return;
            let musicInfoParsed = JSON.parse(musicInfo);
            if (!musicInfoParsed.info) return;
            setInfoChangeCuzReload(true);
            setCurPlayingId(musicInfoParsed.info.inner_id);
            return;
        }

        const f = async function () {
            audioRef.current.pause();
            audioRef.current.src = await getDomesticApiUrl(cookie.token) + "/music/get?id=" + curPlayingId + "&token=" + cookie.token + "&timestamp=" + Date.now();
            if (firstCall) {
                if (localStorage) {
                    let musicInfo = localStorage.getItem("musicPlayerInfo");
                    if (musicInfo) {
                        let musicInfoParsed = JSON.parse(musicInfo);
                        audioRef.current.currentTime = musicInfoParsed.currentTime ? musicInfoParsed.currentTime : 0;
                    }
                }

                setFirstCall(false);
            } else {
                audioRef.current.currentTime = 0;
                // audioRef.current.pause();
                // setPlaying(false);
                // console.log(delay);
                if (delay <= 0) {
                    audioRef.current.play();
                    onDurationChange();
                } else {
                    setTimeout(() => {
                        // console.log("now play");
                        if (!audioRef.current || audioRef.current.currentTime != 0) return;
                        // console.log("play again");
                        audioRef.current.play();
                        onDurationChange();
                    }, 1000 * delay);
                    setDelay(-1);
                }
            }
        }
        const f_2 = async function () {
            let k = await (await fetch(await getApiUrl() + "/music/get/info?id=" + curPlayingId + "&token=" + cookie.token)).json();
            if (k.data) k.data.inner_id = curPlayingId;
            k.paused = !playing;
            setCurPlayingInfo(k);
        }

        f();
        f_2();
    }, [curPlayingId]);

    function onPlayButtonClick(setPlayingStats) {
        if (curPlayingId === "###") return;

        setPlaying(setPlayingStats);
        if (setPlayingStats) {
            audioRef.current.play();
            if (audioRef.current.currentTime === 0) {
                onDurationChange();
            }
        } else {
            audioRef.current.pause();
        }
    }

    function onTimeUpdate() {
        setPlaying(!audioRef.current.paused);
        if (!Number.isFinite(audioRef.current.duration)) return;
        progress = audioRef.current.currentTime / audioRef.current.duration;
        setProgressSt(progress);
        setBarWidth(progress);
    }

    async function onDurationChange() {
        try {
            await Promise.race([audioRef.current.play(), new Promise((_, reject) => setTimeout(reject("f"), 1000))]);
        } catch (e) {
            if (e.name === "NotAllowedError") {
                return;
            }
        }

        audioRef.current.currentTime = 0;
        // console.log(Date.now(), "start", audioRef.current.currentTime);
        new Promise(resolve => setTimeout(resolve, 3000)).then(async () => {
            if (!audioRef.current) return;
            // console.log(Date.now(), "end");
            // console.log(audioRef.current.currentTime, audioRef.current.readyState);
            if (0 < audioRef.current.currentTime && audioRef.current.readyState >= 2) return;
            try {
                await audioRef.current.load();
            } catch (e) {
                console.log(e);
                return;
            }
            audioRef.current.play();
            // console.log("load again");
            onDurationChange();
        });
    }

    // 监听换曲目
    EventBus.removeAllListeners("changeMusic");
    EventBus.on("changeMusic", (music) => {
        if (music.inner_id === curPlayingId) {
            setTimeout(onPlayButtonClick(true), 5);
            return;
        }
        setCurPlayingId(music.inner_id);
    });

    // 监听外部播放指令
    EventBus.removeAllListeners("playMusic");
    EventBus.on("playMusic", (bool) => {
        setTimeout(onPlayButtonClick(bool), 5);
    });

    // 监听更改音量
    EventBus.removeAllListeners("musicPlayer_setVolume");
    EventBus.on("musicPlayer_setVolume", (volume) => {
        if (!audioRef.current) return;
        audioRef.current.volume = volume / 100;
    });

    // playinfo sync with title & to localstorage & to eventbus
    useEffect(() => {
        // to title
        if (curPlayingInfo.data) {
            document.title = curPlayingInfo.data.title;
        }

        // to eventbus
        EventBus.emit("musicPlayer_musicInfo", curPlayingInfo);

        // to localstorage
        if (infoChangeCuzReload && curPlayingInfo.code === "Success") {
            setInfoChangeCuzReload(false);
            return;
        }
        if (curPlayingInfo.code !== "Success") return;
        if (!localStorage) return;
        if (!curPlayingInfo || curPlayingInfo.code !== "Success") {
            localStorage.removeItem("musicPlayerInfo");
            return;
        }
        localStorage.setItem("musicPlayerInfo", JSON.stringify({
            info: curPlayingInfo.data,
            currentTime: 0,
        }));
    }, [curPlayingInfo]);

    // 把播放信息存到localstorage
    function saveInfoToLocalStorage() {
        if (!localStorage || !audioRef.current) return;
        let k = localStorage.getItem("musicPlayerInfo");
        if (!k) return;
        let k_parsed = JSON.parse(k);
        k_parsed.currentTime = audioRef.current.currentTime;
        localStorage.setItem("musicPlayerInfo", JSON.stringify(k_parsed));
    }

    useEffect(() => {
        if (!window) return;
        window.setInterval(saveInfoToLocalStorage, 1000);
    }, []);

    // 播放结束后操作
    function onEnded() {
        let playingMode = localStorage.getItem("musicPlayerConfig");
        if (!playingMode) {
            audioRef.current.pause();
            setPlaying(false);
            return;
        }
        let playingMode_parsed = JSON.parse(playingMode);
        switch (playingMode_parsed.playingMode) {
            case "single_loop":
                audioRef.current.currentTime = 0;
                setTimeout(() => {
                    if (!audioRef.current || audioRef.current.currentTime != 0) return;
                    audioRef.current.play();
                }, 1000 * playingMode_parsed.delay);
                break;
            case "shuffle":
                setDelay(playingMode_parsed.delay);
                let k = localMusicList;
                let randomIndex = Math.floor(Math.random() * k.length);
                setCurPlayingId(k[randomIndex].inner_id);
                break;
            case "list_loop":
                setDelay(playingMode_parsed.delay);
                let e = localMusicList;
                let index = e.findIndex(x => x.inner_id === curPlayingId);
                setCurPlayingId(e[(index + 1) % e.length].inner_id);
                break;
            default:
                setPlaying(false);
                audioRef.current.pause();
                break;
        }
    }

    return (
        <header className="bg-[#16161a] w-full bottom-0 fixed select-none">
            <div className="grid grid-rows-1 grid-cols-12 text-white text-center pt-2">
                <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} hidden preload="auto"></audio>
                <div className="hidden lg:col-span-1 lg:inline">
                    {Utils.secToString(audioRef.current?.currentTime)}
                </div>
                <div className="col-span-12 px-10 lg:px-0 lg:col-span-10" onMouseDown={onMouseDown}>
                    <div className={music_player.progress_div} ref={progressBarRef}>
                        <div className={music_player.progress_bar} style={{ width: barWidth * 100 + '%' }}>
                            <div className={music_player.progress_thumb}></div>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:col-span-1 lg:inline">
                    {Utils.secToString(audioRef.current?.duration - audioRef.current?.currentTime)}
                </div>
            </div>
            <div className="w-full text-white pb-4">
                <div className="grid grid-cols-12 grid-rows-1">
                    <div className="col-span-5">

                    </div>
                    <div className="col-span-2 grid place-items-center">
                        <div>
                            {playing ? <PauseIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200" onClick={() => onPlayButtonClick(false)}></PauseIcon>
                                :
                                <PlayIcon className={"h-10 w-10 text-gray-300 group-hover:text-gray-200 " + (curPlayingId === "###" ? "cursor-not-allowed" : "")} onClick={() => onPlayButtonClick(true)}></PlayIcon>
                            }
                        </div>
                    </div>
                    <div className="col-span-5">

                    </div>
                </div>
            </div>
        </header>
    )
}