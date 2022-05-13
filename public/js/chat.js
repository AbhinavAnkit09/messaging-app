const socket = io()



//Elements
const $messageForm = document.querySelector('#form1')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')

const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight +newMessageMargin

    //visible Height
    const visibleHeight = $messages.offsetHeight


    // Height of messages conatiner
    const containerHeight =$messages.scrollHeight

    // How far have I scrolled
    const scroolOffset = $messages.scrollTop + visibleHeight

    if(containerHeight- newMessageHeight <= scroolOffset) {

        $messages.scrollTop = $messages.scrollHeight

    }

}

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('D/M/YYYY HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend',html)

    autoscroll()
})


socket.on('locationMessage', (locationUrl) => {
    console.log(locationUrl)

    const urlHtml = Mustache.render(locationTemplate, {
        username:locationUrl.username,
        coord:locationUrl.url,
        createdAt:moment(locationUrl.createdAt).format('D/M/YYYY HH:mm')
    })

    $messages.insertAdjacentHTML('beforeend',urlHtml)

    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})



$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled')
    //disable

    //const message = document.querySelector('input').value
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message, (comment) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus() 
        //enable


        if(comment) {
            return console.log(comment)
        }

        console.log('Message delivered')
    })
})


$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    //disable
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })


})



socket.emit('join', {username , room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})

