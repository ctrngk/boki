const {allDataNextCard} = require("../../../utils/common");
const {decideNextCard} = require("../../../utils/common");
const {sanitizeEntity} = require("strapi-utils");
const {performance} = require('perf_hooks')
const {Card} = require('../../../utils/alg')


module.exports = {
  // GET /hello
  async index(ctx) {
    const rawBuilder = strapi.connections.default.raw(
      "select * from CARDS where deck = ?", 58
    );
    const resp = await rawBuilder.then();
    const rows = resp.rows

    ctx.send('Hello World!');
  },

  async findOne(ctx) {
    const {deckID } = ctx.params

    const rawBuilder = strapi.connections.default.raw(
      "select * from CARDS where deck = ?", deckID
    ) //drawback: without media
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
};
