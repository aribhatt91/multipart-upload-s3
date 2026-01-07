/* eslint-disable @typescript-eslint/no-explicit-any */

const Logger = {
    info: console.info,
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(...args);
        }
    }
}

export default Logger;