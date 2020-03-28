const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const md5 = require('md5');

//const writeStream = fs.createWriteStream('post.txt');


// Write Header
//writeStream.write('content');


/*const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'local:9200',
    log: 'error'
});*/

'use strict'

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(express.static('public'));

const url = 'https://www.ptt.cc/bbs/index.html'
//const url = 'https://www.ptt.cc/bbs/Gossiping/index.html'

request({
    url,
    headers: {
        Cookie: "over18=1;"
    }
}, (err, res, body) => {
    const myURL = new URL(`${url}`);

    console.log(myURL.origin);
    console.log(myURL.href);
    console.log(myURL.hostname);
    console.log(myURL.host);
    console.log(myURL.protocol);
    const hostUrl = (myURL.protocol + '//' + myURL.host);
    console.log(hostUrl);


    //writeStream.write(`${body}`);
    fs.writeFile('body.txt', `${body}`, function (err) {
        if (err)
            console.log(err);
        else
            console.log('Write operation complete.');
    });
    const $ = cheerio.load(body)

    //console.log($.html());

    // select all link
    let link = [];
    let linkmd5 = [];
    $('a').each(function (i, elem) {
        if ($(this).attr('href')) {
            link.push($(this).attr('href'));
            thisurl = $(this).attr('href').startsWith('http') ? $(this).attr('href') : (hostUrl + $(this).attr('href'));
            //console.log(thisurl);
            link.push(thisurl);
            //console.log(md5(thisurl));
            linkmd5.push(md5(thisurl));
        }


    })
    console.log(link)
    fs.writeFile('link.txt', `${link}`, function (err) {
        if (err)
            console.log(err);
        else
            console.log('Write operation complete.');
    });
    fs.writeFile('linkmd5.txt', `${linkmd5}`, function (err) {
        if (err)
            console.log(err);
        else
            console.log('Write operation complete.');
    });

    // select all text
    let text = []
    $('div').each(function (i, elem) {
        text.push($(this).text());
    })
    //console.log(text)

    fs.writeFile('text.txt', `${text}`, function (err) {
        if (err)
            console.log(err);
        else
            console.log('Write operation complete.');
    });
})



//Elastic Search

const {
    Client
} = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

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



// Search api
async function onSearch(req, res) {
    console.log('onSearch');

    const searchInput = req.body.searchInput;

    // Let's search!
    const {
        body
    } = await client.search({
        index: 'game-of-thrones',
        body: {
            query: {
                match: {
                    quote: `${searchInput}`
                }
            }
        }
    })

    console.log(body.hits.hits)
}
app.post('/api/search', onSearch);

*/


const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});