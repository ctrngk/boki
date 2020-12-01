'use strict'
const {sanitizeEntity} = require('strapi-utils')


/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  // from official docs
  async find(ctx) {
    console.log("controllers/topic.js find method called..")

    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.topic.search(ctx.query)
    } else {
      entities = await strapi.services.topic.find(ctx.query)
    }
    return entities.map(
      entity => sanitizeEntity(
        entity, {
          model: strapi.models.topic
        }
      )
    );
  },

  async findOne(ctx) {
    console.log("controllers/topic.js FindOne method called..")
    const {id} = ctx.params;

    const entity = await strapi.services.topic.findOne({id});
    return sanitizeEntity(entity, {model: strapi.models.topic});
  },

  async delete(ctx) {
    console.log("DELETE controllers/topic.js called..")
    const {id} = ctx.params
    const topicID = id
    // console.log({topicID})

    const topic = await strapi.services.topic.findOne({id})
    const deckIDS = topic.decks.map(x => x.id)
    // console.log({deckIDS})
    const decks = await Promise.all(...[deckIDS.map(async deckID =>
      await strapi.services.deck.findOne({id: deckID}))])
    const cardIDS = decks.flatMap(deck => deck.cards.flatMap(x => x.id))
    // console.log({cardIDS})
    const mediaIDS = decks.flatMap(
      deck => deck.cards.flatMap(
        card => card.media.flatMap(
          media => media.id
        )))
    // console.log({mediaIDS})
    const mediaFiles = await Promise.all(
      ...[mediaIDS.map(async mediaID =>
        await strapi.plugins['upload'].services.upload.fetch({id: mediaID})
      )]
    )
    // console.log({mediaFiles})

    const asyncRes = await Promise.all(
      ...[
        // delete all the related media files
        mediaFiles.map(async file => {
          await strapi.plugins['upload'].services.upload.remove(file)
        }),

        // delete all the related cards
        cardIDS.map(async id => {
          await strapi.services.card.delete({id})
        }),
        // delete all the related decks
        deckIDS.map(async id => {
          await strapi.services.deck.delete({id})
        }),
        // delete this single topic
        // strapi.services.topic.delete({id: topicID})
      ]
    )
    // console.log({asyncRes})
    const entity = await strapi.services.topic.delete({id: topicID})
    return sanitizeEntity(entity, {model: strapi.models.topic})
  },
}
