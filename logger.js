const fs = require('fs');
const path = require('path');
require('dotenv').config()

class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath;
    }

    log(message,level) {
        const logMessage = `[${new Date().toISOString()}] ${level} ${message}\n`;
        
        if(process.env.debug_mode === 'True'){
            console.log(logMessage); 
        }
        
        fs.appendFile(this.logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
    }
}

const logFilePath = path.join(__dirname, 'app.log');
const logger = new Logger(logFilePath);
exports.logger = logger;