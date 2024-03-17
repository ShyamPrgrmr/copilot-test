/**
 * Initializes a WebSocket connection and handles events for refreshing images.
 *
 * @event DOMContentLoaded - The event fired when the initial HTML document has been completely loaded and parsed.
 * @event open - The event fired when the WebSocket connection is successfully established.
 * @event message - The event fired when a message is received from the WebSocket server.
 * @event close - The event fired when the WebSocket connection is closed.
 *
 * @function onLoad - Handles the loading of images from the server and updates the container element.
 *
 * @param {WebSocket} socket - The WebSocket object used for communication with the server.
 * @param {string} key - The key used for retrieving images from the server.
 */
const socket = new WebSocket('ws://localhost:9000');
let key = ""
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('refresh_button');
    button.addEventListener('click', function() {
        socket.send('refresh_images');
    });
});

socket.addEventListener('open', function (event) {
    socket.send('get_key');
});

socket.addEventListener('message', function (event) {
    if(event.data.includes('key:')){
        key = event.data.split(':')[1];
        onLoad();
    }else if(event.data === 'Images updated'){
        onLoad();
    }
});

socket.addEventListener('close', function (event) {
    console.log('Connection closed');
});



async function onLoad(){
    const response = await fetch('/get-images?key=' + key);
    const data = await response.json();
    const images = data.images;
    const container = document.getElementById('slider_box');

    container.innerHTML = "";

    images.forEach(image => {   
        const img = document.createElement('swiper-slide');
        img.className = "img_container";
        img_link = image.link;
        img.style=`background-image: url('${img_link}'); background-position: center center; background-size: contain; margin-right: 30px;`
        let temp = document.createElement('div');
        temp.style='height: 900px; width: 100%;'
        img.appendChild(temp);
        container.appendChild(img);
    });
}

