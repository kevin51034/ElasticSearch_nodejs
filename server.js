const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const md5 = require('md5');
const dns = require('dns');
const rp = require('request-promise');

var HashTable = require('./hashtable.js');

//Elastic Search

const {
    Client
} = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

/*const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'local:9200',
    log: 'error'
});*/

//'use strict'

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(express.static('public'));

//const url1 = 'https://github.com/'
//const url1 = 'https://news.google.com/topstories?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
const url1 = 'https://www.ptt.cc/bbs'
//const table = new Int32Array(100);
const link = [url1];
const seenDBTable = [];
const successDB = [];
let crawlercount = 0;
//let count = 0;
// robots-parser

async function main() {
    await batchCrawler();
    const delay = t => { // 先撰寫一個等待的 function
        return new Promise(resolve => {
            setTimeout(resolve, t);
        });
    };
    console.log(link);
    console.log('success URL number: ' + successDB.length);
    for (let i = 0; i < 10; i++) {
        //console.log('await loop ' + `${i}`)
        await batchCrawler();
        await delay(5000);
        //console.log('link -> ');
        console.log(link);
        console.log('success URL number: ' + successDB.length);
        await client.indices.refresh({
            index: 'pageinfo'
        })
    }
    console.log(crawlercount);
    //batchCrawler();
}
main();


// batch process
async function batchCrawler() {
    for (let count = 0; link.length > 0 && count < 10; count++) {
        crawlercount++;
        if (link[count]) {
            let url = link[count];
            link.shift();
            console.log('request number: ' + `${count}`)
            //console.log('request : ' + `${url}`)
            dorequest(url, count)
            //promiseRequest(url);
        } else {
            return;
        }
    }

}

async function dorequest(url, count) {
    request({
        url,
        headers: {
            Cookie: "over18=1;"
        }
    }, (err, res, body) => {
        console.log('Crawling  -> ' + `${url}`)

        var objInfo = {};

        const myURL = new URL(`${url}`);
        const hostUrl = (myURL.protocol + '//' + myURL.host);
        objInfo['URL'] = myURL;
        objInfo['hostUrl'] = hostUrl;
        //objInfo['raw body'] = body;

        // get IP address
        dns.lookup(`${myURL.hostname}`, (err, address, family) => {
            console.log('IP address: %j family: IPv%s', address, family);
            objInfo['IP address'] = address;
            // get domain name
            if (address) {
                dns.lookupService(`${address}`, 22, (err, hostname, service) => {
                    console.log(hostname, service);
                    objInfo['Domain name'] = hostname;
                });
            }

        });


        if (!body) {
            return 0;
        }
        const $ = cheerio.load(body)
        //console.log($.html());
        let linkmd5 = [];
        //let hashKey = [];

        $('a').each(function (i, elem) {
            if ($(this).attr('href')) {
                //link.push($(this).attr('href'));
                thisurl = $(this).attr('href').startsWith('http') ? $(this).attr('href') : (hostUrl + $(this).attr('href'));
                let seen = HashTable.put(md5(thisurl), thisurl, seenDBTable);
                //console.log('seen ---> ' + `${seen}`);
                if (seen === 0) {
                    //console.log('push link')
                    link.push(thisurl);
                    linkmd5.push(md5(thisurl));
                }
            }
        })
        /*
        fs.writeFile('udb.txt', `${link}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });
        fs.writeFile('linkmd5.txt', `${linkmd5}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });*/

        /*var obj = {
            table: seenDBTable
        };
        let outputObj = JSON.stringify(obj);
        fs.writeFile('seenhashTable.json', `${outputObj}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });*/

        // select all text
        let text = []
        $('div').each(function (i, elem) {
            text.push($(this).text());
        })
        //console.log(text)
        //objInfo['text body'] = text;

        /*
        fs.writeFile('text.txt', `${text}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });
        fs.writeFile('body.txt', `${body}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });*/

        /*
        // InfoDB output
        setTimeout(() => {
            console.log('wait 5s');
            let outputObjInfo = JSON.stringify(objInfo);
            fs.writeFile(`./InfoDB/${md5(myURL)}.json`, `${outputObjInfo}`, function (err) {
                if (err)
                    console.log(err);
                else
                    console.log('Write operation complete.');
            });
        }, 3000);*/
        var objSuccess = {

        };
        successDB.push(myURL);
        
        /*objSuccess['successURL'] = successDB;
        let outputObjSuccess = JSON.stringify(objSuccess);
        fs.writeFile('successDB.json', `${outputObjSuccess}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });*/
        //console.log('successDB -> ')
        //console.log(successDB);

        storePageInfo(myURL,text)

    })

}

async function storePageInfo(myURL,text) {
    await client.index({
        index: 'pageinfo',
        //type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
        body: {
            URL: `${myURL}`,
            text: `${text}`
        }
    })
}


/*
async function run() {
    // Let's start by indexing some data
    await client.index({
        index: 'game-of-thrones',
        //type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
        body: {
            character: 'Ned Stark',
            quote: 'Winter is coming.'
        }
    })

    await client.index({
        index: 'game-of-thrones',
        //type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
        body: {
            character: 'Daenerys Targaryen',
            quote: 'I am the blood of the dragon.'
        }
    })

    await client.index({
        index: 'game-of-thrones',
        //type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
        body: {
            character: 'Tyrion Lannister',
            quote: 'A mind needs books like a sword needs a whetstone.'
        }
    })

    // here we are forcing an index refresh, otherwise we will not
    // get any result in the consequent search
    await client.indices.refresh({
        index: 'game-of-thrones'
    })

    /*
    // Let's search!
    const {
        body
    } = await client.search({
        index: 'game-of-thrones',
        body: {
            query: {
                match: {
                    quote: 'winter'
                }
            }
        }
    })
    const {
        body
    } = await client.get({
        index: 'my-index',
        id: '1'
    })
    //console.log(body)

    //console.log(body.hits.hits)
}

//run().catch(console.log)
run();

*/

// Search api
async function onSearch(req, res) {
    console.log('onSearch');

    const searchInput = req.body.searchInput;

    // Let's search!
    const {
        body
    } = await client.search({
        index: 'pageinfo',
        body: {
            query: {
                match: {
                    text: `${searchInput}`
                }
            }
        }
    })

    console.log(body.hits.hits)
}
app.post('/api/search', onSearch);




const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});