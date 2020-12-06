import {ApolloClient, InMemoryCache} from "@apollo/client";
import {gql} from '@apollo/client';

const axios = require('axios')
const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

const client = new ApolloClient({
    uri: `${SERVER_BASE_URL}/graphql`,
    cache: new InMemoryCache()
});

const deckData_Default = {
    // "New cards" tab
    NEW_STEPS: [15, 1440, 8640],  // in minutes
    GRADUATING_INTERVAL: 15,  // in days
    EASY_INTERVAL: 60,  // in days
    STARTING_EASE: 2.50,  // in percent

    //  "Reviews" tab
    EASY_BONUS: 1.30,
    INTERVAL_MODIFIER: 1,
    MAXIMUM_INTERVAL: 36500,  // in days

    // "Lapses" tab
    LAPSES_STEPS: [20],  // in minutes
    NEW_INTERVAL: 0.70,
    MINIMUM_INTERVAL: 2,  // in days
}

async function getDeckData(deckID) {
    if (deckID) {
        // const res = await axios.get(`${SERVER_BASE_URL}/decks/${deckID}`)
        // const res = await axios.get(`http://localhost:1337/decks/${deckID}`)
        // return res.data

        const res = await client.query({
            query: gql`query {
                deck (id: ${Number(deckID)}) {
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
            }`
        })
        return res.data.deck
    } else {
        return deckData_Default
    }
}


class CardFactory {
    constructor(deckData) {

        this.DECK = deckData
        this.status = 'learning' // can be 'learning', 'learned', or 'relearning'
        this.steps_index = 0
        this.ease_factor = this.DECK.STARTING_EASE
        this.interval = null
        this.history = []

        this.repr = this.repr.bind(this);
        this.choice = this.choice.bind(this);
        this.minutes_to_days = this.minutes_to_days.bind(this);
        this.prompt = this.prompt.bind(this);
        this.pp = this.pp.bind(this);
        this.promptTest = this.promptTest.bind(this);
    }


    repr() {
        return `Card[${this.status}; steps_idx=${this.steps_index}; ease=${this.ease_factor}; interval=${this.interval}]`
    }

    choice(button) {
        //button is one of "wrong", "hard", "good", or "easy"
        // returns a result in days
        this.history.push(button)

        if (this.status === 'learning') {
            // for learning cards, there is no "hard" response possible
            if (button === 'wrong') {
                this.steps_index = 0
                return this.minutes_to_days(this.DECK.NEW_STEPS[this.steps_index])
            } else if (button === 'good') {
                this.steps_index += 1
                if (this.steps_index < this.DECK.NEW_STEPS.length) {
                    return this.minutes_to_days(this.DECK.NEW_STEPS[this.steps_index])
                } else {
                    // we have graduated!
                    this.status = 'learned'
                    this.interval = this.DECK.GRADUATING_INTERVAL
                    return this.interval
                }
            } else if (button === 'easy') {
                this.status = 'learned'
                this.interval = this.DECK.EASY_INTERVAL
                return this.interval
            } else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }
        } else if (this.status === 'learned') {
            if (button === "wrong") {
                this.status = 'relearning'
                this.steps_index = 0
                this.ease_factor = Math.max(1.30, this.ease_factor - 0.20)
                // the anki manual says "the current interval is multiplied by the
                // value of new interval", but I have no idea what the "new
                // interval" is
                return this.minutes_to_days(this.DECK.LAPSES_STEPS[0])
            } else if (button === 'hard') {
                this.ease_factor = Math.max(1.30, this.ease_factor - 0.15)
                this.interval = this.interval * 1.2 * this.DECK.INTERVAL_MODIFIER
                return Math.min(this.DECK.MAXIMUM_INTERVAL, this.interval)
            } else if (button === 'good') {
                this.interval = (this.interval * this.ease_factor
                    * this.DECK.INTERVAL_MODIFIER)
                return Math.min(this.DECK.MAXIMUM_INTERVAL, this.interval)
            } else if (button === 'easy') {
                this.ease_factor += 0.15
                this.interval = (this.interval * this.ease_factor
                    * this.DECK.INTERVAL_MODIFIER * this.DECK.EASY_BONUS)
                return Math.min(this.DECK.MAXIMUM_INTERVAL, this.interval)
            } else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }

        } else if (this.status === 'relearning') {
            if (button === "wrong") {
                this.steps_index = 0
                return this.minutes_to_days(this.DECK.LAPSES_STEPS[0])
            } else if (button === "good") {
                this.steps_index += 1
                if (this.steps_index < this.DECK.LAPSES_STEPS.length) {
                    return this.minutes_to_days(this.DECK.LAPSES_STEPS[this.steps_index])
                } else {
                    // we have re-graduated!
                    this.status = 'learned'
                    this.interval = Math.max(this.DECK.MINIMUM_INTERVAL, this.interval * this.DECK.NEW_INTERVAL)
                    return this.interval
                }
            } else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }
        }
    }

    minutes_to_days(minutes) {
        return minutes / (60 * 24)
    }

    prompt() {
        let c = new CardFactory(this.DECK)
        let wrong_ivl = this.pp([...this.history, 'wrong'].map(x => c.choice(x)).pop())
        c = new CardFactory(this.DECK)
        let hard_ivl = this.pp([...this.history, 'hard'].map(x => c.choice(x)).pop())
        c = new CardFactory(this.DECK)
        let good_ivl = this.pp([...this.history, 'good'].map(x => c.choice(x)).pop())
        c = new CardFactory(this.DECK)
        let easy_ivl = this.pp([...this.history, 'easy'].map(x => c.choice(x)).pop())
        return {wrong_ivl, hard_ivl, good_ivl, easy_ivl}
    }

    // pretty printed
    pp(ivl) {
        if (ivl && ivl < 1)
            return `${ivl * 1440}m`
        if (ivl && ivl >= 1)
            return `${ivl.toFixed(2)}d`
        return null
    }

    promptTest() {
        const {wrong_ivl, hard_ivl, good_ivl, easy_ivl} = this.prompt()
        return `
        wrong ${wrong_ivl} | hard ${hard_ivl} | good ${good_ivl} | easy ${easy_ivl}
        `
    }
}

const cardData_Default = {
    status: 'learning', // can be 'learning', 'learned', or 'relearning'
    steps_index: 0,
    ease_factor: 2.5,
    interval: null,
    history: []

}

async function getCardData(cardID) {
    if (cardID) {
        const res = await axios.get(`${SERVER_BASE_URL}/cards/${cardID}`)
        return res.data
    } else {
        return cardData_Default
    }
}


class Card extends CardFactory {
    constructor(deckData, cardData) {
        super(deckData)
        // overwrite
        this.status = cardData.status
        this.steps_index = cardData.steps_index
        this.ease_factor = cardData.ease_factor
        this.interval = cardData.interval
        this.history = cardData.history || []
        // extra
        this.accessLeftTime = cardData.accessLeftTime || []
        this.accessStartTime = cardData.accessStartTime || []
        this.scheduleDueTime = cardData.scheduleDueTime || []
        this.statusHistory = cardData.statusHistory || []
    }
}


module.exports = {
    Card,
    getDeckData,
    getCardData
}

// (async () => {
//     const deckData = await getDeckData(1)
//     const cardData = await getCardData(1)
//     const a = new Card(deckData, cardData)
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//
//
// })()

// (async()=> {
//     // const deckData = await getDeckData()
//     const deckData = await getDeckData(1)
//     a = new CardFactory(deckData)
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//
// })();


// (async () => {
//     const deckData = await getDeckData()
//     console.log({deckData})
//     // const deckData = await getDeckData(1)
//     a = new CardFactory(deckData)
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("good")
//     console.log(a.repr())
//     console.log(a.promptTest())
//     a.choice("wrong")
//     console.log(a.repr())
// })();