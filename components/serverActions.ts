"use server"

export async function getBannerText() {
    try {
        const res = await fetch(`${process.env.API_URL}/text`);
        if (!res.ok) throw Error("Fetch failed. Response not ok.");
        return await res.json();
    } catch (err) {
        return err;
    }
}

export async function submitLoginForm(username: string, userAgent: string | null) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/github?user_name=${username}`, { headers: { "User-Agent": userAgent ? userAgent : "" } });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function verifyGithubLoginRedirect(state: string, token: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/github/callback?state=${state}&code=${token}`);
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function verifyOTPLoginRedirect(state: string, token: string, username: string, userAgent: string | null) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/otp/callback?state=${state}&code=${token}&username=${username}`, { headers: { "User-Agent": userAgent ? userAgent : "" } });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function refreshJwt(ref_token: string, username: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/refresh?ref_token=${ref_token}&user_name=${username}`);
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function getProfile(token: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/profiles`, { headers: { "Authorization": "Bearer " + token } });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function submitProfileEditForm(token: string, avatar_url: string | undefined, description: string | undefined) {
    try {
        const res = await fetch(`${process.env.API_URL}/profiles/set`, {
            method: "POST",
            body: JSON.stringify({avatar_url: avatar_url, description: description}),
            headers: { "Authorization": "Bearer " + token }
        });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function removeRefreshToken(token: string, desc_c: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/revoke?desc_c=${desc_c}`, { headers: { "Authorization": "Bearer " + token } });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function fetchJson(url: string, userAgent: string | null = "") {
    let actual_ua = userAgent ? userAgent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0";
    try {
        const res = await fetch(url, { headers: { "User-Agent": actual_ua} });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function addMusic(token: string, musics: any) {
    try {
        const res = await fetch(`${process.env.API_URL}/music/update/add`, {
            method: "POST",
            body: JSON.stringify(musics),
            headers: { "Authorization": "Bearer " + token }
        });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function fetchApiGet(url: string, token: string | null, userAgent: string | null = "") {
    try {
        const res = await fetch(`${process.env.API_URL}/${url}`, {
            headers: { "Authorization": "Bearer " + token, "User-Agent": userAgent ? userAgent : "" }
        });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function fetchApiPost(url: string, token: string | null, data: any, userAgent: string | null = "") {
    try {
        const res = await fetch(`${process.env.API_URL}/${url}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "User-Agent": userAgent ? userAgent : "" }
        });
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function getApiUrl() {
    return process.env.API_URL;
}

export async function checkToken(token: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/auth/check`, {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        let res_b = await res.json();
        return res_b["code"] === "Success";
    } catch (e) {
        return false;
    }
}

export async function getDomesticApiUrl(token: string) {
    if (!await checkToken(token)) return "";
    return process.env.DOMESTIC_API_URL;
}