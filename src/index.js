const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port  = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')


app.use(express.static(publicDirectoryPath))


//server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

//connection is going to fire whenever the socketio server gets a new connection
//socket is an object which contains data about the new connection
io.on('connection', (socket) => {
    console.log('New Web-socket connection')

    socket.on('join', ({username , room}, callback) => {
        const {error, user} = addUser({id:socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('System','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage( 'System',user.username + ' has joined'))

        io.to(user.room).emit('roomData', {
            room:user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })


    socket.on('sendMessage',(msg, callback) => {
        const id = socket.id
        const user = getUser(id)



        if(msg) {
            io.to(user.room).emit('message',generateMessage( user.username,msg))

            // to acknowledge the message was received to server
            callback()
        }
        else {
            callback('Type something')
        }
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message',generateMessage( 'System',user.username+' has left'))

            io.to(user.room).emit('roomData', {
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', (coords,callback) => {
        const user = getUser(socket.id)
        const googlemapsURL = 'https://google.com/maps?q='+encodeURIComponent(coords.latitude)+','+encodeURIComponent(coords.longitude)
        io.to(user.room).emit('locationMessage', generateLocationMessage( user.username,googlemapsURL))
        callback()
    })

})



server.listen(port, () => {
    console.log('Server is up on port '+port)
})


