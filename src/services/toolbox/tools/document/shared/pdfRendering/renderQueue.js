export const runSequentialRenderQueue = async (items, renderItem, onProgress) => {
    const results = [];
    const total = items.length;

    for (let index = 0; index < total; index += 1) {
        const item = items[index];
        if (onProgress) {
            onProgress(index, total, item);
        }
        const result = await renderItem(item, index);
        results.push(result);
    }

    return results;
};
