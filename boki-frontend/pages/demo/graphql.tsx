import {ApolloClient, InMemoryCache} from '@apollo/client';
import {gql} from '@apollo/client';

const {performance} = require('perf_hooks')


const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

const client = new ApolloClient({
    uri: `${SERVER_BASE_URL}/graphql`,
    cache: new InMemoryCache()
});

export async function getServerSideProps(context) {

    let t0, t1
    t0 = performance.now()
    const data = await client.query({
        query: gql`query {
        deck (id: 57) {
            NEW_STEPS
            GRADUATING_INTERVAL
            EASY_INTERVAL
            STARTING_EASE
            EASY_BONUS
            INTERVAL_MODIFIER
            MAXIMUM_INTERVAL
            NEW_INTERVAL
            MINIMUM_INTERVAL
            LAPSES_STEPS
          }
      }
    `
    })
    t1 = performance.now()
    console.log("query decks " + (t1 - t0) + " milliseconds.")


    return {
        props: {data},
    }

}


function Page({data}) {
    return <>
        <pre>
           <code>
                <h1>{JSON.stringify(data, null ,4)}</h1>
           </code>
        </pre>
    </>

}

export default Page