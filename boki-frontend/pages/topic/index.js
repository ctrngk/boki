// redirect to pages/index.js
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Page() {
    const router = useRouter()

    useEffect(() => {
            router.push('/')
    }, [])

    return <p>Redirecting...</p>
}