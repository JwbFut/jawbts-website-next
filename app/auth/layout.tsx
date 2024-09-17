import MusicPlayer from "@/components/musicPlayer";
import { Suspense } from "react";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <Suspense>
            <div className="bg-[#222222] w-screen h-full">
                {children}
            </div>
        </Suspense>
    );
}