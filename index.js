const express = require('express');
const WebSocket = require('ws');
const env_var = require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const logger = require('./logger').logger;
const bodyParser = require('body-parser');
const cors = require('cors');

/**
 * This is a sample Express server with WebSocket and MongoDB integration.
 * @module index
 */


const app = express();
const port = process.env.app_port || 3000;
const wss_port = process.env.app_websocket_port || 9000;
const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@${process.env.db_cluster}/?retryWrites=true&w=majority&appName=${process.env.app_name}`;
const wss = new WebSocket.Server({ port: wss_port });
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});
const db_name = process.env.db_name || 'carousal_app';
const collection_name = process.env.db_collection || 'carousal_app_image_link';
const wensocket_key = process.env.websocket_key;


//express configuration
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('static'));


/**
 * Route for the home page.
 * @name GET /
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/main.html')
});

/**
 * Route for saving an image link.
 * @name POST /save-image
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.post('/save-image', async (req, res) => {
    const { link } = req.body;
    const { key } = req.query;

    if(key !== wensocket_key){
        res.status(401).json({ message: 'Unauthorized' });
        logger.log('Unauthorized request', "ERROR");
        return;
    }
    await client.db(db_name).collection(collection_name).insertOne({ link });
    logger.log('Image link saved successfully', "INFO");
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            logger.log('Images updated', "INFO");
            client.send("Images updated");
        }
    });
    
    res.status(200).json({ message: 'Image link saved successfully' });
});


/**
 * Route for getting all images.
 * @name GET /get-images
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/get-images', async (req, res) => {
    const { key } = req.query;
    if(key !== wensocket_key){
        logger.log('Unauthorized request', "ERROR");
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    
    const images = await client.db(db_name).collection(collection_name).find({}).sort({_id:-1}).toArray();

    logger.log('Images fetched successfully', "INFO");
    res.status(200).json({ images });
});



wss.on('connection', function connection(ws) {
  logger.log('Client connected : ' + ws._socket.remoteAddress + ':' + ws._socket.remotePort, "INFO");
  
  ws.on('message', function incoming(message) {
    if(message == 'get_key')
        {
            ws.send('key:' + wensocket_key);
            logger.log('Key sent to client', "INFO");
        }
  });
    
  ws.on('close', function () {
    logger.log('Client disconnected', "INFO");
  });

});


//start server
(async ()=>{ 
    try{
        await client.connect();
        app.listen(port, () => {
            logger.log(`Server is running on port ${port}`, "INFO");
        });
    }
    catch(err){
        logger.log('Error in connecting to database', "ERROR");
    }
})();


