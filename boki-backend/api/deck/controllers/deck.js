'use strict';
const {sanitizeEntity} = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async delete(ctx) {
    console.log("DELETE controllers/deck.js called..")
    const {id} = ctx.params
    const deckID = id
    // console.log({deckID})

    const deck = await strapi.services.deck.findOne({id: deckID})
    const cardIDS = deck.cards.map(x => x.id)

    const mediaIDS = deck.cards
      .flatMap(x => x.media)
      .flatMap(media => media.id)

    const mediaFiles = await Promise.all(
      ...[mediaIDS.map(async mediaID =>
        await strapi.plugins['upload'].services.upload.fetch({id: mediaID})
      )]
    )
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
      ]
    )
    const entity = await strapi.services.deck.delete({id: deckID})

    return sanitizeEntity(entity, {model: strapi.models.deck})
  },
}
