
const {Card} = require('./alg')

function getStagedCard(cards) {
  // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}
  // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: true]}
  // {id: 1, accessLeftTime: [""], scheduleDueTime: [time: "", countbyday: false]}

  // first Due Card
  // first mins card, not by day
  const minsCard = cards.filter(x => {
    const currentTimeStamp = x.scheduleDueTime?.slice(-1)[0]
    return !currentTimeStamp?.countbyday
  })
  const readyMinsCards = minsCard.filter(x => {
    // get the final item, which is the exact due time. The rest other than final are just leftover notes.
    if (!x.scheduleDueTime) {
      return false // new card
    }
    let dueDate = new Date(x.scheduleDueTime.slice(-1)[0].time) // 10:57
    let now = new Date() // 11:00 right // 9:00 wrong, not ready
    let next_card_min_dif = Math.round(((dueDate - now) / 1000) / 60)
    if (next_card_min_dif <= 0) {
      return true // get all x cards which are ready.
    }
  })
  const daysCard = cards.filter(x => {
    const currentTimeStamp = x.scheduleDueTime?.slice(-1)[0]
    return currentTimeStamp?.countbyday
  })
  const readyDayCards = daysCard.filter(x => {
    // get the final item, which is the exact due time. The rest other than final are just leftover notes.
    if (!x.scheduleDueTime) {
      return false // new card
    }
    let dueDate = new Date(x.scheduleDueTime.slice(-1)[0].time)
    let now = new Date()
    if (dueDate.toDateString() === now.toDateString()) // same date
      return true // get all x cards which are ready. (the same date)
  })
  const readyCards = readyMinsCards.length > 0 ? readyMinsCards : readyDayCards
  return readyCards
}

function decideNextCard(cards) {
  const readyCards = getStagedCard(cards)
  const firstNewCard = cards.find(x => x.history === null)
  if (readyCards.length > 0) {
    // console.log("visiting due card")
    let firstDueCard = readyCards[0]
    return firstDueCard
  } else if (firstNewCard) {
    // console.log(`visiting new card with ID ${firstNewCard.id}`)
    return firstNewCard
  } else {
    return null
  }
}

async function allDataNextCard(nextCard, deckID, cards) {
  let data
  if (nextCard) {
    const rawBuilder = strapi.connections.default.raw(
      "select * from DECKS where id = ?", deckID
    )
    const resp = await rawBuilder.then()
    const deck = resp.rows[0]
    const a = new Card(deck, nextCard)
    data = {
      deckID,
      cardID: nextCard.id,
      stagedCard: nextCard,
      prompt: a.prompt(),
      visitTime: new Date().toJSON(),
      dueInfo: null
    }
  } else {
    // show overview
    // show all due cards
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
    //show overview
    data = {deckID, cardID: null, stagedCard: null, dueInfo: dueCard, prompt: null, accessStartTime: null}
  }
  return data
}


module.exports = {
  getStagedCard,
  decideNextCard,
  allDataNextCard,
}
