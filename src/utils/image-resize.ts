export async function resizeImage(img: any, options?: any) {
    return {
        data: img.data,
        mimeType: img.mimeType,
        originalWidth: 0,
        originalHeight: 0,
        width: 0,
        height: 0,
        wasResized: false,
    };
}

export function formatDimensionNote(result: any) {
    return undefined;
}
