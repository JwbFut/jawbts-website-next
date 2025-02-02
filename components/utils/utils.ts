export default class Utils {
    static escapeDescription(s: string) {
        if (!s) s = "";
        return s.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(/(?<!\\)\\n/g, "<br />")
    }

    static secToString(sec: number) {
        if (sec == null || Number.isNaN(sec)) return "Loading...";
        return Math.floor(sec / 60).toString() + ":" + Math.round(sec % 60).toString().padStart(2, "0");
    }

    static base64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    static arrayBufferToBase64(buffer: ArrayBuffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    static arrayBufferToDataURL(arrayBuffer: ArrayBuffer): Promise<string> {
        return new Promise((resolve, reject) => {
            // 将 ArrayBuffer 转换为 Blob
            const blob = new Blob([arrayBuffer]);

            // 创建 FileReader 实例
            const reader = new FileReader();

            // 定义 onload 回调函数，当读取操作成功完成时触发
            reader.onload = function (event) {
                if (!event.target?.result) return "";
                // event.target.result 包含读取的数据，格式为 Data URL
                resolve(event.target?.result.toString());
            };

            // 定义 onerror 回调函数，当读取操作失败时触发
            reader.onerror = function (error) {
                reject(error);
            };

            // 将 Blob 读取为 Data URL
            reader.readAsDataURL(blob);
        });
    }

    static nonePNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYGAAAAAFAAGKM+MAAAAAAElFTkSuQmCC"

    static getEventX(event: any) {
        if (event.clientX !== undefined) {
            return event.clientX;
        }
        if (!event.touches || event.touches.length === 0) {
            return null;
        }
        return event.touches[0].clientX;
    }

    static getEventY(event: any) {
        if (event.clientY !== undefined) {
            return event.clientY;
        }
        if (!event.touches || event.touches.length === 0) {
            return null;
        }
        return event.touches[0].clientY;
    }

    static async toBlobUrlForceCached(url: string, mimeType: string): Promise<string> {
        const buf = await (await fetch(url, { cache: "force-cache" })).arrayBuffer();
        return URL.createObjectURL(new Blob([buf], { type: mimeType }));
    }
}