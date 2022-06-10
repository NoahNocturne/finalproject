const { dirname } = require('path')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const AWS = require('aws-sdk')

const bucket = 'noahfinalprojbucket'
const table = 'noahfinalprojtable'

AWS.config.update({
    accessKeyId: 'AKIAUJGXXUKK4J2Y2QMT',
    secretAccessKey: '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',
    region: 'ca-central-1'
})

const DynamoDB = new AWS.DynamoDB()
s3 = new AWS.S3({apiVersion: 'latest'});

const app = require('express')()
const bodyParser = require('body-parser')
const multer = require('multer')
const upload = multer({ dest: 'images/' }) // for parsing multipart/form-data

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`listening on port ${port}`))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
const server = require('http').createServer(app)

let images = new Array()

function encode(data) {
    let buf = Buffer.from(data);
    let base64 = buf.toString('base64');
    return base64
}

async function main() {
        let objects = await s3.listObjects({Bucket: bucket}).promise()

        objects.Contents.forEach(async image => {
            let data = await s3.getObject({
                Bucket: bucket,
                Key: image.Key
            }).promise()
        
            images.push({
                key: image.Key,
                type: data.ContentType,
                body: encode(data.Body)
            })
        });

    app.get('/', (req, res) => {
        res.render(__dirname + '/index.html', 
        {   images: JSON.stringify(images)  })
    })

    app.post('/upload', upload.single('image'), (req, res) => {
        const file = req.file
        const filestream = fs.createReadStream(file.path)
        const body = fs.readFileSync(file.path, { encoding: 'base64' })

        const params = {
            Bucket: bucket,
            Body: filestream,
            ContentType: file.mimetype,
            Key: file.filename
        }

        s3.upload(params, async function(err, data) {
            await unlinkFile(file.path)
        })
        
        images.push({
            key: file.filename,
            type: file.mimetype,
            body: body
        })

        const itemParams = {
            TableName: table,
            Item: {
                'Key': { S: file.filename },
                'File Name': { S: file.originalname },
                'Type': { S: file.mimetype }
            }
        }

        DynamoDB.putItem(itemParams, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log(data)
            }   
        })

        res.redirect('/')
    })

    app.get('/delete', (req, res) => {
        const params = {
            Bucket: bucket,
            Key: req.query.key
        }

        s3.deleteObject(params, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                images.splice(images.findIndex(o => o.key == req.query.key), 1)
                res.redirect('/')
            }
        })

        const itemParams = {
            TableName: table,
            "Key": {
                'Key': { S: req.query.key }
            }
        }

        DynamoDB.deleteItem(itemParams, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log(data)
            }   
        })
    })
}

main()