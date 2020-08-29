const config = require('./config.js')
const express = require("express");
const app = express();
const { nanoid } = require('nanoid');
const yup = require('yup');
const helmet = require("helmet");
const morgan = require('morgan');
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
//DB
const monk = require('monk');
const db = monk(config.mongodb_uri);
const urls = db.get('urls');
urls.createIndex({ alias: 1 }, { unique: true });

//FORM HANDLER
const multer  = require('multer')
const storage = multer.diskStorage({
    destination: config.image_directory,
    filename: function (req, file, cb) {
        let str = nanoid(config.length) + '.' + file.originalname.split('.')[1]
        cb(null, str)
    }
})
const upload = multer({ storage })


app.use(morgan('common'));
app.use(express.static('./i'));
app.use(helmet());
app.get('/', (req, res) => res.redirect(config.redirect_uri))

app.get('/panel', (req, res) => {
    if (config.allowed_ips.includes(req.ip)){
        res.sendStatus(200)
    }else {
        res.sendStatus(403)
    }
})

app.post('/',(req, res) => {
    if (!req.headers.secret) {res.status(403); return res.send(config.errorMessage.noSecret);}
    if (config.secret !== req.headers.secret){res.status(403); return res.send(config.errorMessage.invalidSecret);}
    upload.single('file')(req, res, (err) => {
        if (!req.file) {res.status(500); return res.send(config.errorMessage.noFile);}
        if (err){
            switch (err.code) {
                case "LIMIT_FILE_SIZE" :
                    res.status(500)
                    res.send(config.errorMessage.LIMIT_FILE_SIZE)
                    break
                case "LIMIT_FILE_COUNT" :
                    res.status(500)
                    res.send(config.errorMessage.LIMIT_FILE_COUNT)
                    break
                default : res.send(err)
            }
        }else {
            res.send(config.base_uri + req.file.filename)
        }
    })
});

const schema = yup.object().shape({
    alias: yup.string().trim().matches(/^[\w\-]+$/i),
    url: yup.string().trim().url().required(),
});

app.get('/:id', async (req, res) =>{
    const {id : alias} = req.params
    try {
        const url = await urls.findOne({alias})
        if (url) {
            res.redirect(url.url)
        }else {
            res.sendStatus(404)
        }
    }catch (error) {

    }
})

app.post('/url', jsonParser,  async (req, res, next) =>{
    let {alias, url, secret} = req.body
    if (!secret) {res.status(403);res.send(config.errorMessage.noSecret);}
    if (secret !== config.secret) {res.status(403);res.send(config.errorMessage.invalidSecret);}
    try {
        await schema.validate({alias,url})
        if (!alias) alias = nanoid(config.length)
        alias = alias.toLowerCase()
        const urlPacket = {alias, url}
        const existing = await urls.findOne({ alias });
        if (existing) {
           throw new Error('Alias in use.' );
        }
        const created = await urls.insert(urlPacket);
        res.send(config.base_uri +created.alias);
    } catch (error) {
        next(error)
    }
});
app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: config.mode === 'dist' ? '🥞' : error.stack,
    });
});
const port =  process.env.PORT  || 3000;
const listener = app.listen(port , (err) => {
    if (err) throw err;
    console.log(`Uploader ${listener.address().port} portunda hazır!`);
});

