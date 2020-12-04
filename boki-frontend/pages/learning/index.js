import React from 'react'
import Link from "next/link";
import {getStagedCard, getNewCard} from '../../utils/cardUtils'
import Error from 'next/error'
import {EllipsisDiv} from "../../components/customStyles";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

async function getCount(deckID) {
    const deckRes = await fetch(`${SERVER_BASE_URL}/decks/${deckID}`)
    const deckResponse = await deckRes.json()
    const {cards} = deckResponse
    if (!cards) {
        const e = new Error("no card yet")
        e.code = 'ENOENT'
        throw e
    }

    const stagedCards = getStagedCard(cards)
    const newCards = getNewCard(cards)
    const dueCardCount = stagedCards.length
    const newCardCount = newCards.length
    return {dueCardCount, newCardCount}
}

export async function getServerSideProps(context) {


    const res = await fetch(`${SERVER_BASE_URL}/decks`)
    const response = await res.json()
    const data = await Promise.all(response.map(async (r) => {
        const deckID = r.id
        const {dueCardCount, newCardCount} = await getCount(deckID)
        return {
            "title": r.title,
            "id": r.id,
            dueCardCount,
            newCardCount,
        }
    }))

    return {
        props: {data}
    }
}


const Page = ({data}) => {
    return <>
        <h1><Link href="/"><a>HOME</a></Link></h1>
        <button>Learn ALL(not implemented)</button>
        <div style={{
            display: "flex",
            justifyContent: "space-around"
        }}>
            <div>DeckID</div>
            <div>Name</div>
            <div>Due</div>
            <div>New</div>
            <div>Actions</div>
        </div>
        {data.map((x, index) => <>
                <div key={index}
                     style={{
                         display: "flex",
                         justifyContent: "space-around",
                     }}>
                    <div>{x.id}</div>
                    <EllipsisDiv>{x.title}</EllipsisDiv>
                    <div>{x.dueCardCount}</div>
                    <div>{x.newCardCount}</div>
                    <div>
                        <Link href={`/learning/deck/${x.id}`}><a>LEARN</a></Link>
                    </div>
                </div>
            </>
        )}
    </>
}

export default Page