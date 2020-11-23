function getNewCard(cards) {
    return cards.filter(x => x.history === null)
}

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
        let next_card_min_dif = Math.round(((dueDate - now) / 1000) / 60);
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


exports.getStagedCard = getStagedCard
exports.getNewCard = getNewCard