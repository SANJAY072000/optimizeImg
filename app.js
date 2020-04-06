const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const probe = require('probe-image-size');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


const port=process.env.PORT||3000;


app.get('/',(req,res)=>res.status(200)
.json({"Success":"Deployed Successfully"}));


/*
@type - POST
@route - /extract
@desc - a route to extract images
@access - PRIVATE
*/
app.post('/extract',async function(req,res){
let ic=[],linkArray=[],titleNodeList=[],siteUrl,i,page,wth=[],hth=[],out=[];
const browser=await puppeteer.launch({ args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],headless:true});
page=await browser.newPage();


try{
siteUrl=req.body.url;
await page.goto(siteUrl,{waitUntil:"networkidle2",timeout:0});
ic=await page.evaluate(()=>{
  titleNodeList=document.querySelectorAll("img");
  linkArray=[];
  for (i=0;i<titleNodeList.length;++i){
  link=titleNodeList[i].getAttribute("src");
  if(link!==null&&link!=='javascript: void(0)'&&link[0]!=='#'&&
  link!==undefined&&typeof link=='string'&&link!=="")linkArray.push(link);}
  return linkArray;});


// extract user-defined width of images
wth=await page.evaluate(()=>{
titleNodeList=document.querySelectorAll("img");
linkArray=[];
for (i=0;i<titleNodeList.length;++i){
link=titleNodeList[i].getAttribute("width");
linkArray.push(link);}
return linkArray;});


// extract user-defined height of images
hth=await page.evaluate(()=>{
  titleNodeList=document.querySelectorAll("img");
  linkArray=[];
  for (i=0;i<titleNodeList.length;++i){
  link=titleNodeList[i].getAttribute("height");
  linkArray.push(link);}
  return linkArray;});


await browser.close();


// append images name to siteUrl
for(i=0;i<ic.length;++i){
    if(ic[i][0]=='.'&&ic[i][1]=='/')ic[i]=siteUrl+ic[i].substring(2);
    else if(ic[i][0]=='/'&&ic[i][1]=='/')ic[i]=ic[i];
    else if(ic[i][0]=='/'&&ic[i][1]!=='/')ic[i]=siteUrl+ic[i].substring(1);
    else ic[i]=ic[i];
}


// eliminate double slash from url '//'
for(i=0;i<ic.length;++i)
if(ic[i][0]=='/'&&ic[i][1]=='/')ic[i]=`https:${ic[i]}`;


// store unique urls
ic=Array.from(new Set(ic));


// get the original dimensions of images
for(i=0;i<ic.length;++i){
  let smp={};
  smp.url=ic[i];
  smp.optimizedWidth=wth[i];
  smp.optimizedHeight=hth[i];


  if(wth[i]!=null&&hth[i]!=null)
  smp.optimizedDimension=`${wth[i].split("px")[0]}x${hth[i].split("px")[0]}`
  let q1,q2;
  q1=ic[i].split("/").length-1;
  q2=ic[i].split("/")[q1].split(".").length-1;
  let q=ic[i].split("/")[q1].split(".")[q2];


  if(q=='jpeg'||q=='jpg'||q=='png'||q=='gif'||q=='svg'){
  try{
    let asct=await probe(ic[i]);
    smp.orginalWidth=asct.width+"px";
    smp.orginalHeight=asct.height+"px";
    smp.originalDimension=asct.width+"x"+asct.height;
    smp.originalFormat=asct.type;
    smp.originalFileSize=((asct.height*asct.width*3)/1000)+"KB";
    smp.usingHTTPS=true;
    smp.fileName=ic[i].split("/")[q1].split(".")[0];
  }
  catch(err){
    continue;
  }
  }
  out.push(smp);
}
res.status(200).json({"response":{"suggestions":out}});
}
catch(e){console.log(e);}
});



app.listen(port,()=>console.log(`Server is runnig at port ${port}`));








