const {allDataNextCard} = require("../../../utils/common");
const {decideNextCard} = require("../../../utils/common");
const {sanitizeEntity} = require("strapi-utils");
const {performance} = require('perf_hooks')
const {Card} = require('../../../utils/alg')


module.exports = {
  // POST /button
  async index(ctx) {
    const { cardID, button, visitTime } = ctx.request.body
    const cardData = await strapi.services.card.findOne({ id: cardID })

    const deckData = cardData.deck
    const deckID = deckData.id

    const card = new Card(deckData, cardData)
    const prompt = card.prompt()
    let temp = prompt[`${button}_ivl`]
    let NextAppointmentTime;
    if (temp.endsWith("m")) {
      NextAppointmentTime = Number(temp.split("m")[0])
    } else if (temp.endsWith("d")) {
      NextAppointmentTime = Number(temp.split("d")[0]) * 1440 // mins
    }
    card.choice(button)
    let d = new Date()
    let v = new Date()
    v.setMinutes(d.getMinutes() + NextAppointmentTime)
    card.accessLeftTime.push(d.toJSON())
    const countbyday = NextAppointmentTime >= 1440
    card.scheduleDueTime.push({"time": v.toJSON(), countbyday})
    card.statusHistory.push(card.status)
    card.accessStartTime.push(visitTime)
    console.log("card chosen")
    const {
      status,
      steps_index,
      ease_factor,
      interval,
      history,
      accessStartTime,
      accessLeftTime,
      scheduleDueTime,
      statusHistory
    } = card
    const entity = await strapi.services.card.update(
      { id: cardID }, {
        accessStartTime, accessLeftTime, scheduleDueTime,
        history, status, steps_index, ease_factor, interval,
        statusHistory
      }
    )
    console.log("card saved")

    const rawBuilder = strapi.connections.default.raw(
      "select * from CARDS where deck = ?", deckID
    )
    const resp = await rawBuilder.then()
    const cards = resp.rows
    const nextCard = decideNextCard(cards) // without media
    let nextCardComplete
    if (!nextCard) {
      nextCardComplete = null
    } else {
      // add relation: media
      nextCardComplete = await strapi.services.card.findOne({id: nextCard.id})
    }
    // ctx.send("hello world!") // in axios.request.data
    // return 'Hello World!' // in axios.data
    return await allDataNextCard(nextCardComplete, deckID, cards)
  }
}
