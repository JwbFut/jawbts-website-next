"use client"

import { musicDataAsyncer } from '@/components/utils/asyncUtils';
import EventBus from '@/components/logic/eventBus';
import MusicListModifier from '@/components/ui/musicListModifer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect } from 'react';


export default function Page() {
    useEffect(() => {
        let localMusicList: any[] = musicDataAsyncer.get();
        EventBus.emit("musicListModifier_updateMusicList", localMusicList);
    }, []);

    return (
        <div className="box-border m-10 pb-5">
            <div className="w-full">
                <Link href="/nav/music">
                    <ArrowLeftIcon className="h-6 w-6 md:h-10 md:w-10 text-gray-300 group-hover:text-gray-200"></ArrowLeftIcon>
                </Link>
            </div>
            <div className="w-full">
                <MusicListModifier />
            </div>
        </div>
    );
}