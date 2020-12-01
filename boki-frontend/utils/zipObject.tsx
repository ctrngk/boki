// https://stackoverflow.com/q/12199051/6710360
// merge two arrays of keys and values to an object
export const zipObject: any = (keys: string[], values: string[]) => keys.reduce((acc, k, i) => {
    acc[k] = values[i]
    return acc
}, {})