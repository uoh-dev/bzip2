export function binBlob(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(<ArrayBuffer>reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}
