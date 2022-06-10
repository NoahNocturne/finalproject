const express=require('express');
const app=express();
const PORT=3200;
const AWS = require('aws-sdk');
// Our default route
app.get('/',(req,res)=>{
AWS.config.update({
    accessKeyId: 'AKIAUJGXXUKK4J2Y2QMT',
    secretAccessKey: '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',
    region: 'ca-central-1'
      });
let s3 = new AWS.S3();
async function getImage(){
        const data =  s3.getObject(
          {
              Bucket: 'testbucketfinal',
              Key: 'Eliclard.png'
            }
          
        ).promise();
        return data;
      }
getImage()
      .then((img)=>{
        console.log(img)

          let image=`<img src='data:${img.ContentType};base64,` + encode(img.Body) + "'" + "/>";
          let startHTML="<html><body></body>";
          let endHTML="</body></html>";
          let html=startHTML + image + endHTML;
        res.send(html)
      }).catch((e)=>{
        res.send(e)
      })
function encode(data){
          let buf = Buffer.from(data);
          let base64 = buf.toString('base64');
          return base64
      }
})
app.listen(PORT,()=>{
    console.log(`Web Server running on port ${PORT}`);
});