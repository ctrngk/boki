import Error from 'next/error'

export const throw404 = () => {
    if (process.browser) {
        return <Error statusCode={404} />
    }
    const e = new Error()
    e.code = 'ENOENT'
    throw e
}