const colors = {
    reset: "\x1b[0m",
    info: "\x1b[36m", // Cyan
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    debug: "\x1b[35m", // Magenta
};

function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Custom logger replacing console.* for better formatting and colorization.
 */
export const logger = {
    info(message: string, ...optionalParams: any[]) {
        console.log(`[${getTimestamp()}] ${colors.info}[INFO]${colors.reset} ${message}`, ...optionalParams);
    },
    warn(message: string, ...optionalParams: any[]) {
        console.warn(`[${getTimestamp()}] ${colors.warn}[WARN]${colors.reset} ${message}`, ...optionalParams);
    },
    error(message: string, ...optionalParams: any[]) {
        console.error(`[${getTimestamp()}] ${colors.error}[ERROR]${colors.reset} ${message}`, ...optionalParams);
    },
    debug(message: string, ...optionalParams: any[]) {
        console.debug(`[${getTimestamp()}] ${colors.debug}[DEBUG]${colors.reset} ${message}`, ...optionalParams);
    }
};
