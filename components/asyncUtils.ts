"use client"

import { it } from "node:test";
import { fetchApiGet } from "./serverActions";

class Asyncer {
    public name: string;
    public asyncUrl: string;
    public onChange: (data: any) => void;

    constructor(name: string, asyncUrl: string, onChange: (data: any) => void = () => {}) {
        this.name = name;
        this.asyncUrl = asyncUrl;
        this.onChange = onChange;
    }

    public get() {
        return this.getRaw().data;
    }

    public getRaw() {
        const r_data = localStorage.getItem(this.name);
        let data: any;
        if (!r_data) {
            data = { async_time: 0, data: null };
        } else {
            data = JSON.parse(r_data);
            if (!data.async_time || !data.data) {
                data = { async_time: 0, data: null };
            }
        }
        localStorage.setItem(this.name, JSON.stringify(data));
        return data;
    }

    public set(data: any, async_time: number) {
        localStorage.setItem(this.name, JSON.stringify({ async_time: async_time, data: data }));
        this.onChange(data);
    }

    public async checkAndAsync(token: string) {
        const res = await fetchApiGet("async/key", token);
        if (typeof res === "string" || res["code"] != "Success") return false;
        const async_time = res["data"]["async_key"][this.name];

        if (async_time && async_time != this.getRaw().async_time) {
            const res_2 = await fetchApiGet(this.asyncUrl, token);
            if (typeof res_2 === "string" || res_2["code"] != "Success") return false;
            this.set(res_2["data"], async_time);
            return true;
        }

        return true;
    }
}

export const musicDataAsyncer = new Asyncer("music_data", "music/get/list", (data) => {
    let tagsSet = new Set();
    data.forEach((item: any) => {
        item.tags.forEach((tag: any) => {
            tagsSet.add(tag);
        });
    });
    localStorage.setItem("tags", JSON.stringify(Array.from(tagsSet)));
});