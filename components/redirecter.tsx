import { url } from "inspector";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"

interface RedirecterProps {
    startCountdownApproved: boolean;
    startCountdownRejeced: boolean;
    urlApproved: string;
    urlRejected: string;
    reason: string;
}

export const Redirecter: React.FC<RedirecterProps> = ({ startCountdownApproved, startCountdownRejeced, urlApproved, urlRejected, reason }) => {
    const [time, setTime] = useState(10);
    const [bootTimer, setBootTimer] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (startCountdownApproved) setTime(1);
        if (startCountdownRejeced) setTime(10);
        if (startCountdownApproved || startCountdownRejeced) setBootTimer(true);
    }, [startCountdownApproved, startCountdownRejeced]);

    useEffect(() => {
        if (bootTimer) {
            const interval = setInterval(() => {
                setTime(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(interval);

                        setTimeout(() => router.push(urlApproved ? urlApproved : urlRejected), 10);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [bootTimer]);

    return (
        <div>
            {time > 0 && (startCountdownApproved || startCountdownRejeced) && <p>Redirecting in {time} seconds...</p>}
            {time === 0 && <p>Redirecting...</p>}
            {reason && <p>{reason}</p>}
            <br />
            <p>If you are not redirected automatically,
                please click <b><a href={urlApproved ? urlApproved : urlRejected}>here</a></b> or fresh the page.</p>
        </div>
    )
}