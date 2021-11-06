const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const publicDirectoryPath = path.join(__dirname, '../public');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('join', (options, cb) => {
        const { error, user} = addUser({ id: socket.id, ...options })
        if (error)
            return cb(error)

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        cb()
    })
    
    socket.on('sendMessage', (msg, cb) => {
        const filter = new Filter()

        if (filter.isProfane(msg))
            return cb('Profanity is not allowed')

        const user = getUser(socket.id)
        if (!user)
            return cb('Invalid user')

        io.to(user.room).emit('message', generateMessage(user.username, msg))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (location, cb) => {
        const user = getUser(socket.id)
        if (!user)
            return cb('Invaild user')

        const locationMessage = generateLocationMessage(user.username, 'Shared it\'s current location at:', `${location.latitude},${location.longitude}`)
        io.to(user.room).emit('locationMessage', locationMessage)
        cb()
    })
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})