import React, {useMemo} from 'react'
import ComplexTable from '../../components/ComplexTable'
import Link from "next/link";


const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {
    const id = Number(context.query.id)

    const res = await fetch(`${SERVER_BASE_URL}/decks`)
    const decks = await res.json()
    // retention ratio = learning / (learning + learned) ?
    let data = []
    decks.forEach(deck => {
        const currentStatusArray = deck.cards.flatMap(card => card.statusHistory?.slice(-1)) || []
        const learnedCount = currentStatusArray.filter(status => status === 'learned').length
        const relearningCount = currentStatusArray.filter(status => status === 'relearning').length
        const retentionRatio = learnedCount / (learnedCount + relearningCount)
        data = [...data, {
            id: deck.id,
            title: deck.title,
            description: deck.description,
            learned: learnedCount,
            relearning: relearningCount,
            retentionRatio: retentionRatio
        }]
    })

    return {
        props: {
            data
        },
    }
}


const App = ({data}) => {

    const columns = useMemo(
        () => [
            { Header: 'id', accessor: 'id' },
            { Header: 'deck', accessor: 'title' },
            { Header: 'description', accessor: 'description' },
            { Header: 'learned', accessor: 'learned' },
            { Header: 'relearning', accessor: 'relearning' },
            { Header: 'retentionRatio', accessor: 'retentionRatio' }
        ], [])

    const tableData = useMemo(
        () => data.map(x => {
            return {
                id: x.id,
                title: x.title,
                description: x.description,
                learned: x.learned,
                relearning: x.relearning,
                retentionRatio: x.retentionRatio
            }
        }), [])
    return <>
        <Link href="/"><a>HOME</a></Link>
        <h1>Retention Ratio</h1>
        <section>
            <ComplexTable columns={columns} data={tableData}/>
        </section>
        </>
}

export default App