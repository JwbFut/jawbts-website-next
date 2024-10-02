import MusicListModifier from "./musicListModifer";
import EventBus from "./eventBus";
import { useEffect } from "react";
import { musicDataAsyncer } from "./asyncUtils";

const f_callback = (info: any) => {
    EventBus.emit("musicListModifier_setSelectedMusic", info.data);
}

export default function MusicPlayingSettings() {
    useEffect(() => {
        let localMusicList: any[] = musicDataAsyncer.get();
        EventBus.emit("musicListModifier_updateMusicList", localMusicList);
        
        EventBus.removeListener("musicPlayer_musicInfo", f_callback);
        EventBus.on("musicPlayer_musicInfo", f_callback);

        EventBus.emit("musicPlayer_requestMusicInfo");
    }, []);
    
    return (
        <div className="bg-[#313131] rounded-lg mt-5 mb-40">
            <MusicListModifier enableInnerIdSelect={true} />
        </div>
    )
}