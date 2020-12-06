// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {Card, getCardData, getDeckData} from "../../utils/alg";
import axios from "axios"

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export default async (req, res) => {
    if (req.method === 'POST') {
        console.log("POST request detected", req.body)
        const {button, cardID, deckID, visitTime} = req.body

        const cardData = await getCardData(cardID)
        const deckData = cardData.deck

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
        const API = `${SERVER_BASE_URL}/cards/${cardID}`
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

        const response = await axios.put(API, {
            accessStartTime, accessLeftTime, scheduleDueTime,
            history, status, steps_index, ease_factor, interval,
            statusHistory
        })
        console.log("card saved")
        res.status(response.status)
        res.json(response.statusText)

    } else {
        // Handle any other HTTP method
    }
}
