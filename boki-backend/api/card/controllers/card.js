'use strict';

const {sanitizeEntity} = require('strapi-utils');



/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async delete(ctx) {
    console.log("DELETE controllers/card.js called..")
    const {id} = ctx.params
    const cardID = id
    console.log({cardID})
    const card = await strapi.services.card.findOne({id: cardID})
    console.log({card})
    const mediaIDS = card.media.flatMap(media => media.id)
    console.log({mediaIDS})
    const mediaFiles = await Promise.all(
      ...[mediaIDS.map(async mediaID =>
        await strapi.plugins['upload'].services.upload.fetch({id: mediaID})
      )]
    )
    console.log({mediaFiles})

    const asyncRes = await Promise.all(
      ...[
        // delete all the related media files
        mediaFiles.map(async file => {
          await strapi.plugins['upload'].services.upload.remove(file)
        }),
      ]
    )
    console.log({asyncRes})
    const entity = await strapi.services.card.delete({id: cardID})
    return sanitizeEntity(entity, {model: strapi.models.card})
  },



};
