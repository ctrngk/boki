// learning/deck/[id].js
import React, {useState, useEffect, useMemo} from 'react'
import {Card, getCardData, getDeckData} from '../../../utils/alg'
import axios from 'axios'
import Link from "next/link"
import ComplexTable from "../../../components/ComplexTable"
import CustomAudio from "../../../components/playSound"
import {getStagedCard} from "../../../utils/cardUtils"
import Error from "next/error";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {

    const deckID = Number(context.query.id)

    const res = await axios.get(`${SERVER_BASE_URL}/decideNextCard/${deckID}`)
    const card = res.data
    return {props: {data: card}}

}

const Page = ({data}) => {
    const [showBack, setShowBack] = useState(false)

    // const {cardID, deckID, stagedCard, prompt, visitTime} = data

    const [card, setCard] = useState(data)


    const handleAnswer = async (button, cardID, deckID) => {
        console.log({button})
        const res = await axios.post(`${SERVER_BASE_URL}/button`, {
            button,
            cardID,
            deckID,
            visitTime: card.visitTime
        })
        setCard(res.data)
        setShowBack(false)
    }

    const tableData = React.useMemo(
        () => data.dueInfo && data.dueInfo.map(x => {
            if (x.due.endsWith("mins"))
                x.modify_due = x.due
            else
                x.modify_due = `${Number(x.due.split("days")[0]) * 1440}mins (${x.due})`

            return {
                id: x.id,
                // due: x.due
                due: x.modify_due // for sorted purpose
            }
        }), []
    )

    const columns = useMemo(
        () => [
            {Header: 'id', accessor: 'id'},
            {Header: 'due', accessor: 'due'},
        ]
    )

    return (<>
        <Link href="/learning"><a>Learning Center</a></Link>
        {card.stagedCard?.media.length > 0
        && card.stagedCard?.media.some(x => {
            return x.mime?.split("/")[0] === "audio"
        })
        && <CustomAudio audios={card.stagedCard?.media.map(x => {
            return x.mime?.split("/")[0] === "audio" && `${SERVER_BASE_URL}${x.url}`
        })}/>}
        {card.stagedCard &&
        <>
            <div className="content" dangerouslySetInnerHTML={{__html: card.stagedCard.front.html}}/>

            <button onClick={() => {
                setShowBack(true)
            }}>show
            </button>
            <button onClick={() => {
                setShowBack(false)
            }}>hide
            </button>

            {showBack &&
            <>
                <div className="content" dangerouslySetInnerHTML={{__html: card.stagedCard.back.html}}/>
                <div className="content" dangerouslySetInnerHTML={{__html: card.stagedCard.description.html}}/>
            </>
            }

            <hr/>
            {card.prompt.wrong_ivl && <>
                <button onClick={() => handleAnswer("wrong", card.cardID, card.deckID)}>wrong</button>
                {card.prompt.wrong_ivl}</>}
            {card.prompt.hard_ivl && <>
                <button onClick={() => handleAnswer("hard", card.cardID, card.deckID)}>hard</button>
                {card.prompt.hard_ivl}</>}
            {card.prompt.good_ivl && <>
                <button onClick={() => handleAnswer("good", card.cardID, card.deckID)}>good</button>
                {card.prompt.good_ivl}</>}
            {card.prompt.easy_ivl && <>
                <button onClick={() => handleAnswer("easy", card.cardID, card.deckID)}>easy</button>
                {card.prompt.easy_ivl}</>}

        </>
        }
        {card.dueInfo &&
        <>
            <div>ALL FINISHED? No staged card yet</div>
            <ComplexTable columns={columns} data={tableData}/>
        </>
        }


    </>)





}

export default Page