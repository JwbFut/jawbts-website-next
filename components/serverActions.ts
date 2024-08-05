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
    const res = await fetch(`${process.env.API_URL}/auth/github?user_name=${username}`, { headers: { "User-Agent": userAgent ? userAgent : "" } });
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function verifyGithubLoginRedirect(state: string, token: string) {
    const res = await fetch(`${process.env.API_URL}/auth/github/callback?state=${state}&code=${token}`);
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function refreshJwt(ref_token: string, username: string) {
    const res = await fetch(`${process.env.API_URL}/auth/refresh?ref_token=${ref_token}&user_name=${username}`);
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function getProfile(token: string) {
    const res = await fetch(`${process.env.API_URL}/profiles`, { headers: { "Authorization": "Bearer " + token } });
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function submitProfileEditForm(token: string, avatar_url: string | undefined, description: string | undefined) {
    const res = await fetch(`${process.env.API_URL}/profiles/set`, {
        method: "POST",
        body: JSON.stringify({avatar_url: avatar_url, description: description}),
        headers: { "Authorization": "Bearer " + token }
    });
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}

export async function removeRefreshToken(token: string, desc_c: string) {
    const res = await fetch(`${process.env.API_URL}/auth/revoke?desc_c=${desc_c}`, { headers: { "Authorization": "Bearer " + token } });
    try {
        return await res.json();
    } catch (e) {
        return (e as Error).message;
    }
}