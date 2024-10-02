import { ChevronRightIcon, PauseIcon, PlayIcon, TrashIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import EventBus from "./eventBus";
import { useEffect, useState } from "react";
import { musicDataAsyncer } from "./asyncUtils";
import { fetchApiPost } from "./serverActions";
import { useCookies } from "react-cookie";

const f_mi_callback = (data: any) => {
    EventBus.emit("musicListModifier_updateMusicInfo", data);
}

export default function MusicListModifier(props: any) {
    const [cookie, setCookie] = useCookies(["username", "token"]);
    const [musicList, setMusicList] = useState(new Array<any>(0));
    const [musicListSelectedStatus, setMusicListSelectedStatus] = useState(new Array<Boolean>(0));
    const [musicDisplayList, setMusicDisplayList] = useState(new Array<any>(0));
    const [curPlayingMusic, setCurPlayingMusic] = useState(null);
    const [deletedMusicList, setDeletedMusicList] = useState(new Array<any>(0));
    const [localMusicList, setLocalMusicList] = useState(new Array<any>(0));
    const [mode, setMode] = useState("modify");
    const [innerIdFilter, setInnerIdFilter] = useState("");

    useEffect(() => {
        setLocalMusicList(musicDataAsyncer.get());
    }, [musicList]);

    useEffect(() => {
        onFilterChange();
        setMusicListSelectedStatus(new Array<Boolean>(musicList.length).fill(false));
    }, [musicList]);

    EventBus.removeAllListeners("musicListModifier_updateMusicList");
    EventBus.on("musicListModifier_updateMusicList", (data) => {
        setMusicList(data);
        if (!props.enableInnerIdSelect) setMusicDisplayList(data);
    });

    EventBus.removeAllListeners("musicListModifier_setMode");
    EventBus.on("musicListModifier_setMode", (data) => {
        setMode(data);
    });

    EventBus.removeAllListeners("musicListModifier_appendMusic");
    EventBus.on("musicListModifier_appendMusic", (data) => {
        let musicList_updated = Array.from(musicList);
        musicList_updated.push(...data);
        setMusicList(musicList_updated);
    });

    EventBus.removeAllListeners("musicListModifier_getMusicList");
    EventBus.on("musicListModifier_getMusicList", (data) => {
        let musicList_updated = Array.from(musicList);
        musicList_updated.filter((value) => {
            return findDeletedIndex(value) == -1 && findLocalIndex(value) == -1;
        });
        data(musicList_updated);
    });

    EventBus.removeAllListeners("musicListModifier_setSelectedMusic");
    EventBus.on("musicListModifier_setSelectedMusic", (data) => {
        if (!props.enableInnerIdSelect) return;
        if (innerIdFilter == data["inner_id"]) return;
        setInnerIdFilter(data["inner_id"]);
    });

    function getMusicBgColorHtml(music: any) {
        if (findLocalIndex(music) != -1 && mode == "add") return "bg-[#351919]";
        if (findDeletedIndex(music) != -1) return "bg-[#191919]";
        return musicListSelectedStatus[findIndex(music)] ? "bg-[#515151] hover:bg-[#555555]" : "hover:bg-[#353535]"
    }

    // 同步播放信息
    EventBus.removeListener("musicPlayer_musicInfo", f_mi_callback);
    EventBus.on("musicPlayer_musicInfo", f_mi_callback);
    EventBus.removeAllListeners("musicListModifier_updateMusicInfo");
    EventBus.on("musicListModifier_updateMusicInfo", (data) => {
        if (data != curPlayingMusic) setCurPlayingMusic(data);
    });

    EventBus.emit("musicPlayer_requestMusicInfo", "mainPage");

    // 最右边那个播放按钮
    async function onClickC(event: any, music: any) {
        event.preventDefault();

        setCurPlayingMusic(music);
        EventBus.emit("changeMusic", music);
    }

    function findIndex(music: any) {
        let index = -1;
        for (let i = 0; i < musicList.length; i++) {
            if (musicList[i]["inner_id"] == music["inner_id"]) {
                index = i;
                break;
            }
        }
        return index;
    }

    function findDeletedIndex(music: any) {
        let index = -1;
        for (let i = 0; i < deletedMusicList.length; i++) {
            if (deletedMusicList[i]["inner_id"] == music["inner_id"]) {
                index = i;
                break;
            }
        }
        return index;
    }

    function findLocalIndex(music: any) {
        let index = -1;
        for (let i = 0; i < localMusicList.length; i++) {
            if (localMusicList[i]["inner_id"] == music["inner_id"]) {
                index = i;
                break;
            }
        }
        return index;
    }

    // 最左边的选择按钮
    let selectStartFrom = -1;
    async function onClickD(event: any, music: any) {
        event.preventDefault();

        if (findLocalIndex(music) != -1 && mode == "add") return;
        if (findDeletedIndex(music) != -1) return;

        if (event.ctrlKey == 1) {
            if (selectStartFrom == -1) {
                selectStartFrom = findIndex(music);
            } else {
                let endIndex = findIndex(music);
                let selList = Array.from(musicListSelectedStatus);
                for (let i = Math.min(selectStartFrom, endIndex); i <= Math.max(selectStartFrom, endIndex); i++) {
                    if (findDeletedIndex(musicList[i]) != -1) continue;
                    selList[i] = !selList[i];
                }
                selectStartFrom = -1;
                setMusicListSelectedStatus(selList);
            }
        } else {
            let index = findIndex(music);
            let selList = Array.from(musicListSelectedStatus);
            selList[index] = !selList[index];
            setMusicListSelectedStatus(selList);

            selectStartFrom = -1;
        }
    }

    // 垃圾桶按钮
    async function onClickE(event: any, music: any) {
        event.preventDefault();

        let deletedMusicList_updated = Array.from(deletedMusicList);

        if (findLocalIndex(music) != -1 && mode == "add") return;

        if (findDeletedIndex(music) != -1) {
            deletedMusicList_updated = deletedMusicList_updated.filter((value) => {
                return value["inner_id"] != music["inner_id"];
            });

        } else {
            deletedMusicList_updated.push(music);
            let selList = Array.from(musicListSelectedStatus);
            selList[findIndex(music)] = false;

            if (musicListSelectedStatus[findIndex(music)]) {
                selList.forEach((value, index, self) => {
                    if (value) {
                        deletedMusicList_updated.push(musicList[index]);
                        self[index] = false;
                    }
                });
            }

            setMusicListSelectedStatus(selList);
        }

        setDeletedMusicList(deletedMusicList_updated);
    }

    // filter logic
    let filters = {
        nameFilter: new RegExp(""),
        authorFilter: new RegExp(""),
        tagsFilter: new Array<string>(0),
    }

    const [nameFilterError, setNameFilterError] = useState(false);
    function onNameFilterChange(event: any) {
        event.preventDefault();

        try {
            let reg = new RegExp(event.target.value, "i");
            filters.nameFilter = reg;
            setNameFilterError(false);
        } catch (error) {
            console.log((error as Error).message);
            setNameFilterError(true);
            return;
        }

        onFilterChange();
    }

    const [authorFilterError, setAuthorFilterError] = useState(false);
    function onAuthorFilterChange(event: any) {
        event.preventDefault();

        try {
            let reg = new RegExp(event.target.value, "i");
            filters.authorFilter = reg;
            setAuthorFilterError(false);
        } catch (error) {
            console.log((error as Error).message);
            setAuthorFilterError(true);
            return;
        }

        onFilterChange();
    }

    function onTagsFilterChange(event: any) {
        event.preventDefault();

        filters.tagsFilter = event.target.value.split(" ");

        onFilterChange();
    }

    useEffect(() => {
        onFilterChange();
    }, [innerIdFilter]);

    function onFilterChange() {
        if (!musicList) return;

        let displayListUpdated = Array.from(musicDisplayList);
        let selectListUpdated = Array.from(musicListSelectedStatus);

        displayListUpdated = musicList.filter((value) => {
            let k = true;
            filters.tagsFilter.forEach((tag) => {
                if (!value.tags.concat(value.static_tags).includes(tag)) {
                    k = false;
                }
            });
            if (filters.tagsFilter.length == 0 || filters.tagsFilter[0] == "") k = true;
            if (props.enableInnerIdSelect && (innerIdFilter == "###" || innerIdFilter == "" || innerIdFilter != value.inner_id)) {
                return false;
            }
            return filters.nameFilter.test(value.title) && filters.authorFilter.test(value.author) && k;
        });


        for (let i = 0; i < selectListUpdated.length; i++) {
            let k = false;
            displayListUpdated.forEach((value) => {
                if (value.inner_id == musicList[i]["inner_id"]) {
                    k = true;
                }
            });
            selectListUpdated[i] = selectListUpdated[i] && k;
        }

        setMusicDisplayList(displayListUpdated);
        setMusicListSelectedStatus(selectListUpdated);
    }

    // comfirm delete logic
    const [confirmDelete, setConfirmDelete] = useState(false);
    async function onConfirmDelete() {
        if (confirmDelete) {
            let localMusicList_updated = musicDataAsyncer.get();
            localMusicList_updated = localMusicList_updated.filter((value: any) => {
                return findDeletedIndex(value) == -1;
            });
            const res = await fetchApiPost("music/update/remove", cookie.token, { music_data: deletedMusicList });
            if (typeof res == "string") {
                console.log(res);
            } else if (res["code"] != "Success") {
                console.log(res["data"]["reason"]);
            } else {
                musicDataAsyncer.set(localMusicList_updated, res["data"]["async_time"]);
            }

            window.location.reload();
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 5000);
        }
    }

    // tag edit logic
    const [tagEditMode, setTagEditMode] = useState(false);
    const [tagEditError, setTagEditError] = useState(false);
    const [tagEditCreate, setTagEditCreate] = useState(false);
    const [currentTags, setCurrentTags] = useState("未选择");
    const [currentTagsList, setCurrentTagsList] = useState(new Array<string>(0));
    const [tagCommandCache, setTagCommandCache] = useState("");

    async function onTagsEditChange(event: any, submit: boolean = false) {
        if (event) event.preventDefault();

        let tagCommand;
        if (!event) {
            tagCommand = tagCommandCache;
        } else if (event.target && event.target.value != null) {
            if (event.target.value.length > 0) {
                setTagEditMode(true);
            }
            else {
                setTagEditMode(false);
            }

            tagCommand = event.target.value;
        } else {
            const formData = new FormData(event.currentTarget);
            if (formData.get("tagsFilter") == null) return;
            tagCommand = formData.get("tagsFilter")?.toString();
        }

        setTagCommandCache(tagCommand);

        const illegalChar = ["'", "$", "\\", "/", "*", "?", "(", ")", "[", "]", "{", "}", ":", ";", "|", "<", ">", "\"", ",", ".", "，", "。"];
        for (let i = 0; i < illegalChar.length; i++) {
            if (tagCommand.includes(illegalChar[i])) {
                setTagEditError(true);
                return;
            }
        }

        let editMode = "add";
        if (tagCommand.startsWith("-")) {
            editMode = "remove";
            tagCommand = tagCommand.slice(1);
        } else if (tagCommand.startsWith("+")) {
            tagCommand = tagCommand.slice(1);
        }
        const tagList = tagCommand.split(" ");

        setTagEditCreate(false);
        setTagEditError(false);

        if (tagList.length == 0 || tagList[0] == "") return;

        let tags_set = new Set(tagList);
        if (tags_set.size != tagList.length) {
            setTagEditError(true);
            return;
        }

        if (editMode == "add") {
            let m = false;
            tagList.forEach((tag: string) => {
                if (currentTagsList.includes(tag)) {
                    m = true;
                }
            });
            if (m) {
                setTagEditError(true);
                return;
            }

            const tagsHave_ = localStorage.getItem("tags");
            if (!tagsHave_) /* this should never happen */ throw new Error("localStorage.getItem('tags') is null");
            let tagsHave = JSON.parse(tagsHave_);
            let k = false;
            tagList.forEach((tag: string) => {
                if (!tagsHave.includes(tag)) {
                    k = true;
                }
            });
            setTagEditCreate(k);
            if (submit) {
                let musicList_updated = Array.from(musicList);
                let modified: any[] = [];
                musicList_updated.forEach((value: any, index, self) => {
                    if (musicListSelectedStatus[index]) {
                        self[index].tags.push(...tagList);
                        modified.push({
                            inner_id: self[index].inner_id,
                            tags: self[index].tags,
                        });
                    }
                });
                modifyMusicList(musicList_updated);
                if (mode == "modify") {
                    const res = await fetchApiPost("music/update/tag", cookie.token, { music_data: modified });
                    if (typeof res == "string") {
                        console.log(res);
                        return;
                    } else if (res["code"] != "Success") {
                        console.log(res["data"]["reason"]);
                        return;
                    } else {
                        musicDataAsyncer.set(musicList_updated, res["data"]["async_time"]);
                    }
                }
            }
        }
        if (editMode == "remove") {
            let k = false;
            tagList.forEach((tag: string) => {
                if (!currentTagsList.includes(tag)) {
                    k = true;
                }
            });
            setTagEditError(k);
            if (!k && submit) {
                let musicList_updated = Array.from(musicList);
                let modified: any[] = [];
                musicList_updated.forEach((value: any, index, self) => {
                    if (musicListSelectedStatus[index]) {
                        self[index].tags = self[index].tags.filter((value_: any) => {
                            return !tagList.includes(value_);
                        });

                        modified.push({
                            inner_id: self[index].inner_id,
                            tags: self[index].tags,
                        });
                    }
                });
                modifyMusicList(musicList_updated);
                if (mode == "modify") {
                    const res = await fetchApiPost("music/update/tag", cookie.token, { music_data: modified });
                    if (typeof res == "string") {
                        console.log(res);
                        return;
                    } else if (res["code"] != "Success") {
                        console.log(res["data"]["reason"]);
                        return;
                    } else {
                        musicDataAsyncer.set(musicList_updated, res["data"]["async_time"]);
                    }
                }
            }
        }
    }

    useEffect(() => {
        updateCurrentTags();
    }, [musicListSelectedStatus, musicList]);

    useEffect(() => {
        onTagsEditChange(null);
    }, [currentTagsList]);

    function updateCurrentTags() {
        let tags_all = new Set<string>();
        let k_ = false;
        musicListSelectedStatus.forEach((value, index) => {
            if (value) {
                musicList[index].tags.forEach((tag: string) => tags_all.add(tag));
                k_ = true;
            }
        });
        let tags = Array.from(tags_all);
        tags.sort();

        tags = tags.filter((value_) => {
            let k = true;
            musicListSelectedStatus.forEach((value, index) => {
                if (value) {
                    if (!musicList[index].tags.includes(value_)) {
                        k = false;
                    }
                }
            });
            return k;
        });

        setCurrentTagsList(tags);
        if (!k_) setCurrentTags("未选择");
        else setCurrentTags(tags.toString());
    }

    function getTagEditColor() {
        if (tagEditError) return "bg-[#715a5a]";
        if (tagEditCreate) return "bg-[#71715a]";
        return "bg-[#494949]";
    }

    // modify likes logic
    function onAddLikes(event: any, music: any) {
        event.preventDefault();
        onModifyLikes(music, 1);
    }

    function onMinLikes(event: any, music: any) {
        event.preventDefault();
        onModifyLikes(music, -1);
    }

    async function onModifyLikes(music: any, delta: number) {
        let musicList_updated = Array.from(musicList);
        let modified: any[] = [];
        musicList_updated.forEach((value: any, index, self) => {
            if (musicListSelectedStatus[index] || value.inner_id == music.inner_id) {
                self[index].likes += delta;

                modified.push({
                    inner_id: self[index].inner_id,
                    likes: self[index].likes,
                });
            }
        });
        modifyMusicList(musicList_updated);
        if (mode == "modify") {
            const res = await fetchApiPost("music/update/tag", cookie.token, { music_data: modified });
            if (typeof res == "string") {
                console.log(res);
                return;
            } else if (res["code"] != "Success") {
                console.log(res["data"]["reason"]);
                return;
            } else {
                musicDataAsyncer.set(musicList_updated, res["data"]["async_time"]);
            }
        }
    }

    // utils
    function modifyMusicList(newMusicList: any[]) {
        setMusicList(newMusicList);
        let displayListUpdated = Array.from(musicDisplayList);
        displayListUpdated.forEach((value, index, self) => {
            for (let i = 0; i < newMusicList.length; i++) {
                if (value.inner_id == newMusicList[i].inner_id) {
                    self[index] = newMusicList[i];
                }
            }
        });
        setMusicDisplayList(displayListUpdated);
    }

    return (
        <div className="bg-[#313131] rounded-lg py-5 mt-7 mb-10">
            <form className="grid grid-rows-1 grid-cols-12 text-gray-300 text-center mb-4" onSubmit={(event) => onTagsEditChange(event, true)}>
                <div className="col-span-1"></div>
                <div className="col-span-5">
                    {tagEditMode && (
                        <div>当前标签: {currentTags}</div>
                    )}
                </div>
                <div className="col-span-3">
                    <input className={"rounded-md mx-1 text-center " + getTagEditColor()}
                        name="tagsFilter" type="text" onInput={onTagsEditChange}
                    ></input>
                </div>
                <div className="col-span-3">
                    {tagEditMode && (
                        <button className="border-2 border-gray-300 h-10 w-20 text-lg text-gray-200 text-center"
                            name="tagsFilter" type="submit"
                        >确定</button>
                    )}
                </div>
            </form>
            <div className="grid grid-rows-1 grid-cols-12 text-gray-300 text-center mb-1">
                <div className="col-span-1">
                    {mode == "modify" && (
                        <TrashIcon className={"h-10 w-10 group-hover:text-gray-200 cursor-pointer inline " + (confirmDelete ? "text-red-500" : "text-gray-300")}
                            onClick={onConfirmDelete}
                        ></TrashIcon>
                    )}
                </div>
                <div className="col-span-3">
                    <input className={"rounded-md mx-1 text-center " + (nameFilterError ? "bg-[#715a5a]" : "bg-[#494949]")}
                        name="nameFilter" type="text" onInput={onNameFilterChange}
                    ></input>
                </div>
                <div className="col-span-2">
                    <input className={"rounded-md mx-1 text-center w-20 " + (authorFilterError ? "bg-[#715a5a]" : "bg-[#494949]")}
                        name="authorFilter" type="text" onInput={onAuthorFilterChange}
                    ></input>
                </div>
                <div className="col-span-3">
                    <input className="rounded-md mx-1 text-center bg-[#494949]"
                        name="tagsFilter" type="text" onInput={onTagsFilterChange}
                    ></input>
                </div>
                <div className="col-span-2"></div>
                <div className="col-span-1"></div>
            </div>
            <div className="grid grid-rows-1 grid-cols-12 text-gray-300 text-center select-none">
                <div className="col-span-1"></div>
                <div className="col-span-3">标题</div>
                <div className="col-span-2">作者</div>
                <div className="col-span-3">标签</div>
                <div className="col-span-2">偏好</div>
                <div className="col-span-1"></div>
            </div>
            {musicDisplayList.map((music: any) => (
                <div key={music.title} className={"grid grid-rows-1 grid-cols-12 text-gray-300 text-center gap-5 my-1 " +
                    getMusicBgColorHtml(music)}>
                    <div key={music.title + "A"} className="col-span-1">
                        <ChevronRightIcon key={music.title + "AA"} className="h-10 w-1/2 text-gray-300 group-hover:text-gray-200 cursor-pointer inline"
                            onClick={(event) => onClickD(event, music)}
                        ></ChevronRightIcon>
                        <TrashIcon key={music.title + "AB"} className="h-10 w-1/2 text-gray-300 group-hover:text-gray-200 cursor-pointer inline"
                            onClick={(event) => onClickE(event, music)}
                        ></TrashIcon>
                    </div>
                    <div key={music.title + "B"} className="col-span-3">{music.title}</div>
                    <div key={music.title + "C"} className="col-span-2">{(music.author_a ? music.author_a + " : " : "") + music.author}</div>
                    <div key={music.title + "D"} className="col-span-3">{(music.static_tags.concat(music.tags)).toString()}</div>
                    <div key={music.title + "E"} className="col-span-2">
                        <div className="grid grid-rows-1 grid-cols-3 select-none justify-center">
                            <div className="col-span-1 flex items-center justify-center">
                                <MinusIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer justify-center"
                                    onClick={(event) => onMinLikes(event, music)}
                                ></MinusIcon>
                            </div>
                            <div className="col-span-1 flex items-center justify-center">{music.likes}</div>
                            <div className="col-span-1 flex items-center justify-center">
                                <PlusIcon className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer justify-center"
                                    onClick={(event) => onAddLikes(event, music)}
                                ></PlusIcon>
                            </div>
                        </div>
                    </div>
                    <div key={music.title + "F"} className="col-span-1 flex items-center justify-center">
                        {curPlayingMusic && curPlayingMusic["data"] && !curPlayingMusic["paused"] && curPlayingMusic["data"]["inner_id"] == music.inner_id ? (
                            <PauseIcon key={music.title + "G"} className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer"
                                onClick={() => { EventBus.emit("playMusic", false); setCurPlayingMusic(null); }}
                            ></PauseIcon>
                        ) : (
                            <PlayIcon key={music.title + "G"} className="h-10 w-10 text-gray-300 group-hover:text-gray-200 cursor-pointer"
                                onClick={(event) => onClickC(event, music)}
                            ></PlayIcon>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}