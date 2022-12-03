const _ = require('lodash');
const fs = require('fs');
const { v4 } = require('uuid');
const spawn = require('child_process').spawn;

const messages = require('./data/messages.json');

module.exports = {
    post: async (req, res) => {
        console.log(req.body);
        let output = "";
        const msg = {
            id: v4(),
            from: req.body.from,
            type: req.body.type,
            content: req.body.content
        }

        const pythonProcess = spawn('python', [
            './model/executable.py',
            msg.content,
        ], {detached: true,
            maxBuffer: 10 * 1024 * 1024 * 1024});

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });


        pythonProcess.on('exit', (data) => { 
            // if (output=="") {
            //     return;
            // }
            toHide = output.includes('{true}');
            console.log(output);
        
            msg.toHide = toHide;
        
            messages.push(msg);

            fs.writeFile('./data/messages.json', JSON.stringify(messages), function writeJSON(err) {
                if (err) return console.log(err);
                console.log(JSON.stringify(messages));
                console.log('writing to JSON file');
            });
    
            res.status(200).json({
                status: 'success',
                msg,
            });
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
    },
    get: async (req, res, next) => {
    console.log(messages);
    
    res.status(200).json({
        status: 'success',
        messages,
    });
    }
}

