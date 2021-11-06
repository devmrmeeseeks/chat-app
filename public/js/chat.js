const socket = io()

//Elements
const $chatForm = document.querySelector('#chat-form')
const $chatFormInput = $chatForm.querySelector('input')
const $chatFormButton = $chatForm.querySelector('button')
const $shareLocation = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMsgTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    
}

socket.on('message', (res) => {
    const html = Mustache.render(messageTemplate, {
        message: res.text,
        username: res.username,
        createdAt: moment(res.createdAt).format('h:mm A')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (res) => {
    const html = Mustache.render(locationMsgTemplate, {
        message: res.text,
        username: res.username,
        location: res.url,
        createdAt: moment(res.createdAt).format('h:mm A')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, { room, users })
    document.querySelector('#sidebar').innerHTML = html
})

$chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $chatFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (err) => {
        $chatFormButton.removeAttribute('disabled')
        $chatFormInput.value = ''
        $chatFormInput.focus()

        if (err) {
            alert(err)
            location.href = '/'
        }
    })
})

$shareLocation.addEventListener('click', () => {
    if (!navigator.geolocation)
        return alert('Geolocation is not supported by your browser')
    
    $shareLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (err) => {
            if (err) {
                alert(err)
                location.href = '/'
            }
            $shareLocation.removeAttribute('disabled')
            $chatFormInput.focus()
        })
    })
})

socket.emit('join', { username, room }, (err) => {
    if (err) {
        alert(err)
        location.href = '/'
    }
})