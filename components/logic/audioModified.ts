"use client"

import AudioFetcher from "./audioFetcher";

export default class AudioModified {
    private src: string = "";
    private paused: boolean = true;
    private ticking: boolean = false;
    audioFetcher: AudioFetcher = new AudioFetcher();
    private audio = new Audio();
    private _ended: boolean = false;
    public ended: boolean = false;

    constructor() {
    }

    play() {
        this.paused = false;
        if (this._ended) {
            this._ended = false;
            this.setCurTime(0);
        }
    }

    pause() {
        this.paused = true;
    }

    isPaused() {
        return this.paused;
    }

    getCurTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration;
    }

    getBuffered() {
        return this.audioFetcher.getBuffered();
    }

    setVolume(volume: number) {
        this.audio.volume = volume;
    }

    setSrc(src: string) {
        this.src = src;
        this.onSrcChange();
    }

    setCurTime(curTime: number) {
        this.audioFetcher.curTime = this.audio.currentTime;
        this.audio.currentTime = curTime;
        this._ended = false;
    }

    setOnTimeUpdate(callback: () => void) {
        this.audio.addEventListener("timeupdate", () => {
            callback();
        });
    }

    setOnPlay(callback: () => void) {
        this.audio.onplay = callback;
    }

    getEnded() {
        return this._ended;
    }

    private onSrcChange() {
        this.audioFetcher.setSrc(this.src);
        this.audio.currentTime = 0;
        this.pause();
        this.audioFetcher.setBlobUrlChangeCallback((url) => {
            this.audio.src = url;
            this._ended = false;
        });
    }

    async tick() {
        if (this.ticking) return;
        this.ticking = true;
        try {
            await this._tick();
        } finally {
            this.ticking = false;
        }
    }

    private async _tick() {
        if (Math.abs(this.audio.currentTime - this.audio.duration) < 0.5 && !this._ended) {
            this._ended = true;
        }
        this.ended = this._ended;
        if (this.src == "") return;

        await this.audioFetcher.tick();

        if (this.audioFetcher.getSrc() == "") return;
        this.audioFetcher.curTime = this.audio.currentTime;

        if (this.audio.paused != this.paused) {
            if (this.paused) {
                this.audio.pause();
            } else {
                Promise.race([this.audio.play(), new Promise((resolve) => setTimeout(resolve, 2000))]);
            }
        }
    }
}