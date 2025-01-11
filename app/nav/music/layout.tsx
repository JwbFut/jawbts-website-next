import MusicPlayer from "@/components/ui/musicPlayer";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="bg-[#222222] w-screen h-full">
            {children}
            <MusicPlayer />
        </div>
    );
}