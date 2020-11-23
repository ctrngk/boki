// formatBytes(bytes,decimals)

// formatBytes(1024);       // 1 KB
// formatBytes('1024');     // 1 KB
// formatBytes(1234);       // 1.21 KB
// formatBytes(1234, 3);    // 1.205 KB
// https://stackoverflow.com/a/18650828/6710360
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default formatBytes