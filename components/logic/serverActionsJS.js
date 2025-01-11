"use server"
import QRCode from "qrcode";

export async function generateQRCode(text) {
    return QRCode.toDataURL(text);
}