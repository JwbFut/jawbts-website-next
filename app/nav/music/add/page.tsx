"use client"

import { musicDataAsyncer } from '@/components/utils/asyncUtils';
import BiliBiliUtils from '@/components/utils/bilibiliUtils';
import EventBus from '@/components/logic/eventBus';
import MusicListModifier from '@/components/ui/musicListModifer';
import { addMusic } from '@/components/logic/serverActions';
import {
    ArrowLeftIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { useCookies } from "react-cookie";

const importOptions = ["B站-单个视频", "B站-系列视频", "B站-合集", "B站-收藏夹"];

export default function Page() {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [error, setError] = useState("");
    const [musicList, setMusicList] = useState(new Array<any>(0));

    let localMusicList: any[] = [];
    useEffect(() => {
        localMusicList = musicDataAsyncer.get();
        EventBus.emit("musicListModifier_updateMusicList", []);
        EventBus.emit("musicListModifier_setMode", "add");
    }, []);

    // 展开按钮
    function onClickA() {
        setPopupOpen(!popupOpen);
    }

    // 导入按钮
    function onClickB(event: MouseEvent<HTMLDivElement>, option: string) {
        setSelectedType(option);
        event.preventDefault();
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        if (loading) return;
        setError("");
        setLoading(true);
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        let id = formData.get(selectedType)?.toString();
        if (!id) {
            setError("没填!");
            setLoading(false);
            return;
        }

        let list = Array.from(musicList);
        if (selectedType == "B站-单个视频") {
            let k = await BiliBiliUtils.getPages(id);
            if (typeof k == "string") {
                setError(k);
            } else {
                list = list.concat(k);
            }
        } else if (selectedType == "B站-系列视频") {
            let k = await BiliBiliUtils.getSeries(id);
            if (typeof k == "string") {
                setError(k);
            } else {
                list = list.concat(k);
            }
        } else if (selectedType == "B站-合集") {
            let k = await BiliBiliUtils.getCollections(id);
            if (typeof k == "string") {
                setError(k);
            } else {
                list = list.concat(k);
            }
        } else if (selectedType == "B站-收藏夹") {
            let k = await BiliBiliUtils.getFavlist(id);
            if (typeof k == "string") {
                setError(k);
            } else {
                list = list.concat(k);
            }
        }

        let duplicated: string[] = [];
        let notDuplicated: string[] = [];
        let list_updated = list.filter((value) => {
            if (!notDuplicated.includes(value["inner_id"])) {
                notDuplicated.push(value["inner_id"]);
                return true;
            } else {
                duplicated.push(value["title"]);
                return false;
            }
        });
        if (duplicated.length > 0) {
            setError("以下歌曲(共" + duplicated.length.toString() + "首)已存在: " + duplicated.toString());
        }

        setLoading(false);
        setMusicList(list_updated);

        let list_append = list_updated.filter((value) => {
            for (let i = 0; i < musicList.length; i++) {
                if (value["inner_id"] == musicList[i]["inner_id"]) {
                    return false;
                }
            }
            return true;
        });

        EventBus.emit("musicListModifier_appendMusic", list_append);
    }

    // 确认按钮
    async function onClickF() {
        if (loading) return;
        setLoading(true);

        EventBus.emit("musicListModifier_getMusicList", async (musicList_updated: any[]) => {
            const res = await addMusic(cookie.token, { music_data: musicList_updated });
            if (typeof res == "string") {
                setError(res);
            } else if (res["code"] != "Success") {
                setError(res["data"]["reason"]);
            } else {
                musicDataAsyncer.set(musicDataAsyncer.get().concat(musicList_updated), res["data"]["async_time"]);

                setMusicList(new Array<any>(0));
                EventBus.emit("musicListModifier_updateMusicList", []);
            }
            setLoading(false);
        });
    }

    return (
        <div className="box-border m-10 pb-5">
            <div className="bg-[#313131] rounded-lg pt-5">
                <div className="grid grid-cols-12 grid-rows-1 pb-4">
                    <div className="col-span-3 md:col-span-1 grid place-content-center">
                        <Link href="/nav/music">
                            <ArrowLeftIcon className="h-6 w-6 md:h-10 md:w-10 text-gray-300 group-hover:text-gray-200"></ArrowLeftIcon>
                        </Link>
                    </div>
                    <div className="col-span-6 md:col-span-10 grid place-content-center">
                        <button className="border-2 border-gray-300 h-10 w-20 text-lg text-gray-200 text-center" onClick={onClickA}>
                            {popupOpen ? "收起" : "展开"}
                        </button>
                    </div>
                    <div className="col-span-3 md:col-span-1 grid place-content-center">
                        <CheckIcon className={"h-6 w-6 md:h-10 md:w-10 text-gray-300 group-hover:text-gray-200" + (loading ? "" : " cursor-pointer")}
                            onClick={onClickF}
                        ></CheckIcon>
                    </div>
                </div>
                {popupOpen && (
                    <div className="text-gray-400 text-center pb-4 select-none">
                        {importOptions.map((option) => (
                            <div key={option} onClick={(event) => onClickB(event, option)} className={selectedType == option ? "text-gray-50" : "cursor-pointer"}>
                                {option}
                            </div>
                        ))}
                        <form className="text-gray-300 mt-2 grid grid-cols-6" onSubmit={onSubmit}>
                            {importOptions.map((option) => (
                                <input key={option + "I"} className={selectedType == option ? "bg-[#494949] rounded-md col-span-4 mx-5 text-center" : "hidden"}
                                    disabled={loading} name={option}
                                ></input>
                            ))}
                            <div className="col-span-2 grid place-content-center">
                                <button className="border-2 h-10 w-20 text-lg text-[#f3f3f3] mx-5" type="submit" hidden={selectedType == ""}
                                    disabled={loading}
                                >{loading ? "导入中..." : "导入"}</button>
                            </div>
                            {error && <div style={{ color: 'red' }} className="text-center w-screen mt-3">{error}</div>}
                        </form>
                    </div>
                )}
            </div>
            <MusicListModifier />
        </div>
    );
}