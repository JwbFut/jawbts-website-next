"use client"

import {
    PlayIcon,
    PauseIcon
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { getDomesticApiUrl } from "@/components/logic/serverActions";
import { useCookies } from "react-cookie";
import Utils from "@/components/utils/utils";
import EventBus from "@/components/logic/eventBus";
import { musicDataAsyncer } from "@/components/utils/asyncUtils";
import AudioModified from '../logic/audioModified';

const DEV_MODE = false;

export default function MusicPlayer() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [playing, setPlaying] = useState(false);
    const [progressSt, setprogressSt] = useState(0);
    const [durationSt, setDurationSt] = useState(0);
    const [curPlayingId, setCurPlayingId] = useState("###");
    const [localMusicList, setLocalMusicList] = useState([]);
    const [curPlayingInfo, setCurPlayingInfo] = useState({
        code: "unfinished",
        data: {
            title: "未知歌曲",
            author: "未知歌手",
            cover: Utils.nonePNG,
            inner_id: "###",
        },
        paused: true,
    });
    const [infoChangeCuzReload, setInfoChangeCuzReload] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) return;
        audioRef.current = new AudioModified();

        audioRef.current.setOnTimeUpdate(onTimeUpdate);
        audioRef.current.setOnPlay(onPlay);
    }, []);

    const canvasRef = useRef(null);
    const [delay, setDelay] = useState(0);

    // tick
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (audioRef.current) {
                audioRef.current.tick();
                // console.log(audioRef.current);
            }
        }, 200);

        return () => {
            // console.log("clear interval");
            window.clearInterval(intervalId);
        };
    }, []);

    let callFlag_musicDataAsyncer = false;
    // 同步先
    useEffect(() => {
        const f = async () => {
            setLocalMusicList(musicDataAsyncer.get());
            await musicDataAsyncer.checkAndAsync(cookie.token);
            setLocalMusicList(musicDataAsyncer.get());
        }
        if (!callFlag_musicDataAsyncer) {
            f();
            callFlag_musicDataAsyncer = true;
        }
    }, []);

    let progress = 0, progressBarLength = 1, slideBeginX = 0, progressBegin = 0;
    const progressRef = useRef(0); // only works during mousemove

    let playing_temp;
    // 进度条逻辑
    function onMouseDown(e) {
        if (!Utils.getEventX(e)) return;
        e.preventDefault();
        playing_temp = !audioRef.current.isPaused();
        audioRef.current.pause();

        slideBeginX = Utils.getEventX(e);
        progressBegin = progressSt;
        progressBarLength = canvasRef.current["offsetWidth"];
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseup', onMouseUp, { passive: true });
        document.addEventListener('touchmove', onMouseMove, { passive: true });
        document.addEventListener('touchend', onMouseUp, { passive: true });
        duringMouseMoveRef.current = true;
    }

    function onMouseMove(e) {
        if (!Utils.getEventX(e)) return;
        progress = (progressBegin * progressBarLength + (Utils.getEventX(e)) - slideBeginX) / progressBarLength;
        progress = progress < 0 ? 0 : progress;
        progress = progress > 1 ? 1 : progress;
        setprogressSt(progress);
        onProgressJump(false);
        progressRef.current = progress;
    }

    const duringMouseMoveRef = useRef(false);

    function onMouseUp() {
        setprogressSt(progress);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
        duringMouseMoveRef.current = false;

        if (playing_temp) audioRef.current.play();
        if (!Number.isFinite(audioRef.current.getDuration())) return;
        audioRef.current.setCurTime(audioRef.current.getDuration() * progress);
        onProgressJump();
    }

    function onProgressJump(delay = true) {
        if (delay) {
            window.setTimeout(() => _onProgressJump(), 100);
        } else {
            window.setTimeout(() => _onProgressJump(), 1);
        }
    }

    function _onProgressJump() {
        const canvas = canvasRef.current;
        if (!canvas || !audioRef.current || audioRef.current.getDuration() == null) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function onPlay() {
        onProgressJump();
    }

    const rafId = useRef(null);
    function updateProgress() {
        const canvas = canvasRef.current;
        if (!canvas || !audioRef.current || !Number.isFinite(audioRef.current.getDuration())) {
            rafId.current = window.requestAnimationFrame(updateProgress);
            return;
        }
        if (durationSt != audioRef.current.getDuration()) setDurationSt(audioRef.current.getDuration());
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        if (DEV_MODE) ctx.clearRect(0, 0, canvas.width, canvas.height);

        const duration = audioRef.current.getDuration();
        for (let i = 0; i < audioRef.current.getBuffered().length; i++) {
            const start = audioRef.current.getBuffered().start(i) / duration;
            const end = audioRef.current.getBuffered().end(i) / duration;
            ctx.fillStyle = '#555';
            ctx.fillRect(start * width, 0, (end - start) * width, height);
        }

        // Draw progress bar
        if (!DEV_MODE) {
            ctx.fillStyle = '#f0f0f0';
            if (duringMouseMoveRef.current) {
                ctx.fillRect(0, 0, progressRef.current * width, height);
            } else {
                ctx.fillRect(0, 0, audioRef.current.getCurTime() / duration * width, height);
            }
        } else {
            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(audioRef.current.getCurTime() / duration * width, 0, 0.002 * width, height);
        }

        rafId.current = window.requestAnimationFrame(updateProgress);
    }
    useEffect(() => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(updateProgress);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        }
    }, []);

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
    useEffect(() => {
        if (audioRef.current && audioRef.current.ended) {
            onEnded();
        }
    }, [audioRef.current?.ended]);

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
            audioRef.current.setSrc(await getDomesticApiUrl(cookie.token) + "/music/get?id=" + curPlayingId + "&token=" + cookie.token + "&timestamp=" + Date.now());
            if (firstCall) {
                if (localStorage) {
                    let musicInfo = localStorage.getItem("musicPlayerInfo");
                    if (musicInfo) {
                        let musicInfoParsed = JSON.parse(musicInfo);
                        audioRef.current.setCurTime(musicInfoParsed.currentTime ? musicInfoParsed.currentTime : 0);
                    }

                    window.setInterval(saveInfoToLocalStorage, 1000);
                }

                setFirstCall(false);
            } else {
                audioRef.current.setCurTime(0);
                if (delay <= 0) {
                    audioRef.current.play();
                    onDurationChange();
                } else {
                    setTimeout(() => {
                        // console.log("now play");
                        if (!audioRef.current || audioRef.current.getCurTime() != 0) return;
                        // console.log("play again");
                        audioRef.current.play();
                        onDurationChange();
                    }, 1000 * delay);
                    setDelay(-1);
                }
            }
        }
        const f_2 = async function () {
            let k = await (await fetch(await getDomesticApiUrl(cookie.token) + "/music/get/info?id=" + curPlayingId + "&token=" + cookie.token)).json();
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
            if (audioRef.current.getCurTime() === 0) {
                onDurationChange();
            }
        } else {
            audioRef.current.pause();
        }
    }

    function onTimeUpdate() {
        setPlaying(!audioRef.current.isPaused());
        if (!Number.isFinite(audioRef.current.getDuration())) return;
        progress = audioRef.current.getCurTime() / audioRef.current.getDuration();
        setprogressSt(progress);
        // updateProgress();
    }

    async function onDurationChange() {
        window.setTimeout(() => onProgressJump(), 1000);
        audioRef.current.play()
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
        audioRef.current.setVolume(volume / 100);
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
            return;
        }
        let k = localStorage.getItem("musicPlayerInfo");
        if (k) k = JSON.parse(k);
        if (!k || k.info?.inner_id !== curPlayingInfo.data.inner_id) {
            localStorage.setItem("musicPlayerInfo", JSON.stringify({
                info: curPlayingInfo.data,
                currentTime: 0,
            }));
        }
    }, [curPlayingInfo]);

    // 把播放信息存到localstorage
    function saveInfoToLocalStorage() {
        if (!localStorage || !audioRef.current) return;
        let k = localStorage.getItem("musicPlayerInfo");
        if (!k) return;
        let k_parsed = JSON.parse(k);
        k_parsed.currentTime = audioRef.current.getCurTime();
        localStorage.setItem("musicPlayerInfo", JSON.stringify(k_parsed));
    }

    // 播放结束后操作
    function onEnded() {
        if (DEV_MODE) console.log("ended");
        onProgressJump(false);
        onProgressJump();
        let playingMode = localStorage.getItem("musicPlayerConfig");
        if (!playingMode) {
            audioRef.current.pause();
            setPlaying(false);
            return;
        }
        let playingMode_parsed = JSON.parse(playingMode);
        switch (playingMode_parsed.playingMode) {
            case "single_loop":
                audioRef.current.setCurTime(0);
                setTimeout(() => {
                    if (!audioRef.current || audioRef.current.getCurTime() != 0) return;
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
            <div className="grid grid-rows-1 grid-cols-12 text-white text-center pt-2 h-8" onTouchStart={onMouseDown}>
                <div className="hidden lg:col-span-1 lg:inline">
                    {Utils.secToString(durationSt * progressSt)}
                </div>
                <div className="col-span-12 px-10 lg:px-0 lg:col-span-10" onMouseDown={onMouseDown}>
                    <canvas ref={canvasRef} width="2000" height="8" className="w-full pt-2 h-4"></canvas>
                </div>
                <div className="hidden lg:col-span-1 lg:inline">
                    {Utils.secToString(durationSt * (1 - progressSt))}
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