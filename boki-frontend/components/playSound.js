import React from 'react'

const CustomAudio = ({audios}) => {
    console.log({audios})

    function getRandSrc(audioArray) {
        if (audioArray.length === 0) return null
        return audioArray[Math.floor(Math.random() * audioArray.length)]
    }

    async function playRand(e, audioArray) {
        const src = getRandSrc(audioArray)
        if (src) {
            e.target.src = src
            await e.target.load()
            await e.target.play()
        } else {
            e.target.currentTime = 0
            await e.target.pause()
        }
    }

    return <>
        <div>
            {
                audios
                    ? <audio autoPlay controls src={getRandSrc(audios)} onEnded={e => playRand(e, audios)}/>
                    : <div></div>
            }
        </div>
    </>

}
export default CustomAudio