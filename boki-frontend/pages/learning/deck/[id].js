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
    const res = await fetch(`${SERVER_BASE_URL}/decks/${deckID}`)
    const response = await res.json()
    const {cards} = response
    if (!cards) {
        const e = new Error("no card yet")
        e.code = 'ENOENT'
        throw e
    }

    // **************alg part**********
    console.log("*********alg part started*********")
    // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}
    // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: true]}
    // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}
    // first Due Card
    const readyCards = getStagedCard(cards)
    // first New Card
    const firstNewCard = cards.find(x => x.history === null)

    if (readyCards.length > 0) {
        console.log("visiting due card")
        let firstDueCard = readyCards[0]
        const deckData = await getDeckData(deckID)
        const cardData = await getCardData(firstDueCard.id)
        const card = new Card(deckData, cardData)
        const prompt = await card.prompt()
        // The difference between card vs firstDueCard?
        // firstDueCard -> JSON
        // card ->
        if (card.accessStartTime.length === card.history.length) {
            // set visit time stamp
            card.accessStartTime.push(new Date().toJSON())
            const API = `${SERVER_BASE_URL}/cards/${firstDueCard.id}`
            const { accessStartTime } = card
            const response = await axios.put(API, { accessStartTime })
        }
        const data = {deckID, cardID: firstDueCard.id, stagedCard: firstDueCard, prompt}
        return {props: {data}}
    } else if (firstNewCard) {
        console.log(`visiting new card with ID ${firstNewCard.id}`)
        const deckData = await getDeckData(deckID)
        const cardData = await getCardData(firstNewCard.id)
        const card = new Card(deckData, cardData)
        const prompt = await card.prompt()
        if (card.accessStartTime.length === card.history.length) {
            // set visit time stamp
            card.accessStartTime.push(new Date().toJSON())
            const API = `${SERVER_BASE_URL}/cards/${firstNewCard.id}`
            const { accessStartTime } = card
            const response = await axios.put(API, { accessStartTime })
        }


        const data = {deckID, cardID: firstNewCard.id, stagedCard: firstNewCard, prompt}
        return {props: {data}}
    } else {
        // show overview
        // show all due cards
        // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}
        // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: true]}
        // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}
        const dueCard = cards.map(x => {
            let dueDate = new Date(x.scheduleDueTime[x.scheduleDueTime.length - 1].time)
            let now = new Date()
            let next_card_min_dif = Math.round(((dueDate - now) / 1000) / 60)
            // return {id: x.id, due: next_card_min_dif + "mins" }
            if (next_card_min_dif >= 1440)
                return {id: x.id, due: (next_card_min_dif / 60 / 24).toFixed(2) + "days"}
            else if (60 < next_card_min_dif && next_card_min_dif < 1440)
                return {id: x.id, due: (next_card_min_dif / 60).toFixed(2) + "hours"}
            else
                return {id: x.id, due: next_card_min_dif + "mins"}
        })
        let data = { deckID, cardID: null, stagedCard: null, dueInfo: dueCard, prompt: null }
        return {props: {data}} //show overview
    }
}

const Page = ({data}) => {
    console.log({data})
    const [showBack, setShowBack] = useState(false)

    const {cardID, deckID, stagedCard, prompt} = data

    const handleAnswer = async (button, cardID, deckID) => {
        const res = await axios.post("/api/button", {button, cardID, deckID})
        await window.location.reload(false)
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
            {
                Header: 'id',
                accessor: 'id'
            },
            {
                Header: 'due',
                accessor: 'due'
            },
        ]
    )

    const [audioArray, setAudioArray] = useState(null)


    return (<>
        <Link href="/learning"><a>Learning Center</a></Link>
        {stagedCard?.media.length > 0 && <CustomAudio audios={stagedCard?.media.map(x => {
            return x.mime?.split("/")[0] === "audio" && `${SERVER_BASE_URL}${x.url}`
        })}/>}
        {/*<code>*/}
        {/*    <pre>*/}
        {/*    {JSON.stringify(stagedCard, null, 8)}*/}
        {/*    </pre>*/}
        {/*</code>*/}
        {stagedCard &&
        <>
            <div className="content" dangerouslySetInnerHTML={{__html: stagedCard.front.html}}/>

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
                <div className="content" dangerouslySetInnerHTML={{__html: stagedCard.back.html}}/>
                <div className="content" dangerouslySetInnerHTML={{__html: stagedCard.description.html}}/>
            </>
            }

            <hr/>
            {prompt.wrong_ivl && <>
                <button onClick={() => handleAnswer("wrong", cardID, deckID)}>wrong</button>
                {prompt.wrong_ivl}</>}
            {prompt.hard_ivl && <>
                <button onClick={() => handleAnswer("hard", cardID, deckID)}>hard</button>
                {prompt.hard_ivl}</>}
            {prompt.good_ivl && <>
                <button onClick={() => handleAnswer("good", cardID, deckID)}>good</button>
                {prompt.good_ivl}</>}
            {prompt.easy_ivl && <>
                <button onClick={() => handleAnswer("easy", cardID, deckID)}>easy</button>
                {prompt.easy_ivl}</>}

        </>
        }
        {data.dueInfo &&
        <>
            <div>ALL FINISHED? No staged card yet</div>
            <ComplexTable columns={columns} data={tableData}/>
        </>
        }


    </>)
}

export default Page