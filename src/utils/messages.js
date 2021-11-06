const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, text, urlQuery) => {
    return {
        username,
        text,
        url: `https://google.com/maps?output=embed&q=${urlQuery}`,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}