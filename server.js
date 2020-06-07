const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const md5 = require('md5');
const dns = require('dns');
const rp = require('request-promise');

var HashTable = require('./hashtable.js');
var moment = require('moment');

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
//const url1 = 'https://www.ettoday.net/';
//const url1 = 'https://www.ptt.cc/bbs'
//const url1 = 'https://www.ptt.cc/bbs/Gossiping/index.html'
//const link = [url1, 0];
const link = [];

const seenDBTable = [];
const successDB = [];
const failDB = [];
let crawlercount = 0;
//const pageInfoDB = [];
let bulkBody = [];
let timeSpanTotal = 0;
// robots-parser
const delay = t => { // wait function
    return new Promise(resolve => {
        setTimeout(resolve, t);
    });
};

async function main() {
    await delay(3000);

    // initialization
    initialization(link, seenDBTable);



    await delay(5000);
    //console.log(link);
    //console.log(seenDBTable);

    var startTime = moment().format();
    console.log(startTime);
    batchCrawler();

    console.log(link);
    console.log('success URL number: ' + successDB.length);
    for (let i = 0; i < 100; i++) {
        var timeSpan = moment();
        console.log('time span : ')
        console.log(timeSpan.diff(startTime, 'seconds'));
        timeSpanTotal = timeSpan.diff(startTime, 'seconds')
        batchCrawler();
        await delay(5000);
        //console.log('link -> ');
        //console.log(link);
        console.log('success URL number: ' + successDB.length);
        /*await client.indices.refresh({
            index: 'pageinfo'
        })*/
        var batchTime = moment().format();
        console.log('batch time : ')
        console.log(batchTime)
        //console.log(seenDBTable);
        /*
        let outputInfoDB = JSON.stringify(pageInfoDB);
        fs.writeFile(`./pageInfoDB.json`, `${outputInfoDB}`, function (err) {
            if (err)
                console.log(err);
            else
                console.log('Write operation complete.');
        });*/

        // TODO: decrease bulkBody request number
        if (bulkBody.length > 150) {
            console.log('request bulk')
            storePageInfoBulk(bulkBody);
            bulkBody = [];
            storeDB(link, seenDBTable);

        }

        await delay(5000);

    }
    console.log(crawlercount);
    //batchCrawler();
}
main();


// batch process
async function batchCrawler() {
    for (let count = 0; link.length > 0 && count < 150; count++) {
        crawlercount++;
        if (link[count]) {
            let url = link[0];
            let depth = ++link[1];
            //console.log(depth)
            link.shift();
            link.shift();

            if (depth > 30) {
                console.log('page depth > 30: return')
                continue;
            }
            dorequest(url, depth)
        } else {
            return;
        }
    }

}

async function dorequest(url, depth) {
    request({
        url,
        headers: {
            Cookie: "over18=1;"
        }
    }, (err, res, body) => {
        //console.log('Crawling  -> ' + `${url}`)
        if (err) {
            failDB.push(url)
            return;
        }
        if (res.statusCode >= 300) {
            failDB.push(url)
            return;
        }

        // page Info
        var objInfo = {};

        const myURL = new URL(`${url}`);
        const hostUrl = (myURL.protocol + '//' + myURL.host);
        objInfo['siteURL'] = myURL;
        objInfo['hostURL'] = hostUrl;
        objInfo['crawlTime'] = moment().format();
        objInfo['pageDepth'] = depth;
        objInfo['statusCode'] = res.statusCode;

        //objInfo['raw body'] = body;

        // get IP address
        dns.lookup(`${myURL.hostname}`, (err, address, family) => {
            //console.log('IP address: %j family: IPv%s', address, family);
            objInfo['ip'] = address;
            // get domain name
            if (address) {
                dns.lookupService(`${address}`, 22, (err, hostname, service) => {
                    //console.log(hostname, service);
                    objInfo['domain'] = hostname;
                });
            }

        });


        if (!body) {
            return 0;
        }
        const $ = cheerio.load(body)
        //console.log($.html());
        //let linkmd5 = [];
        let pageTitle = $("title").text();
        objInfo['pageTitle'] = pageTitle;

        //let hashKey = [];

        $('a').each(function (i, elem) {
            if ($(this).attr('href')) {
                //link.push($(this).attr('href'));
                thisurl = $(this).attr('href').startsWith('http') ? $(this).attr('href') : (hostUrl + $(this).attr('href'));
                //let seen = HashTable.put(md5(thisurl), thisurl, seenDBTable);
                let seen = HashTable.put(md5(thisurl), seenDBTable);

                if (seen === 0) {
                    //console.log('push link')
                    link.push(thisurl, depth);
                    //linkmd5.push(md5(thisurl));
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

        /* seenDBTable
        var obj = {
            table: seenDBTable
        };
        let outputObj = JSON.stringify(obj);
        fs.writeFile('seenhashTable.json', `${outputObj}`, function (err) {
            if (err)
                console.log(err);
            //else
            //console.log('Write operation complete.');
        });*/




        //console.log(text)
        //objInfo['text body'] = text;

        if (objInfo['hostURL'] == 'https://www.ptt.cc' && $('#main-content')) {
            // ptt main content
            //console.log('main1')
            let text = '';
            $('#main-content').map(function (i, elem) {
                if ($(this).text().length > text.length) {
                    //console.log('change text')
                    //console.log($(this).text().trim())
                    text = $(this).text().replace(/^\s+|\s+$/gm, '')
                    //text.push($(this).text());

                }
            })
            objInfo['mainText'] = text;
        } else {
            //console.log('main2')

            // select all text
            let text = [];
            $('div').map(function (i, elem) {
                text.push($(this).text().replace(/^\s+|\s+$/gm, ''));
            })
            objInfo['mainText'] = text;
        }



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



        //console.log(objInfo['mainText'])
        //pageInfoDB.push(objInfo)
        bulkBody.push(objInfo)

        //storePageInfo(objInfo)

    })

}

async function storePageInfo(objInfo) {
    await client.index({
        index: 'pageinfo',
        body: {
            crawlTime: `${objInfo['crawlTime']}`,
            URL: `${objInfo['siteURL']}`,
            hostURL: `${objInfo['hostURL']}`,
            ip: `${objInfo['ip']}`,
            domain: `${objInfo['domain']}`,
            statusCode: `${objInfo['statusCode']}`,
            pageDepth: `${objInfo['pageDepth']}`,
            title: `${objInfo['pageTitle']}`,
            mainText: `${objInfo['mainText']}`
        }
    })
}

async function storeDB(link, seenDBTable) {
    jsonlink = JSON.stringify(link);
    jsontable = JSON.stringify(seenDBTable);
    /*await client.update({
        index: 'udb',
        id: '1',
        body: {
            doc: {
                link: `${jsonlink}`,
            }
        }
    })*/
    await client.index({
        index: 'udb',
        id: '1',
        body: {
            link: `${jsonlink}`,
        }
    })
    await client.index({
        index: 'seenhashtable',
        id: '1',
        body: {
            table: `${jsontable}`,
        }
    })
}


async function storePageInfoBulk(bulkBody) {
    const body = bulkBody.flatMap(doc => [{
        index: {
            _index: 'pageinfo'
        }
    }, doc])

    const {
        body: bulkResponse
    } = await client.bulk({
        refresh: true,
        body
    })

    if (bulkResponse.errors) {
        const erroredDocuments = []
        // The items array has the same order of the dataset we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action, i) => {
            const operation = Object.keys(action)[0]
            if (action[operation].error) {
                erroredDocuments.push({
                    // If the status is 429 it means that you can retry the document,
                    // otherwise it's very likely a mapping error, and you should
                    // fix the document before to try it again.
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: body[i * 2],
                    document: body[i * 2 + 1]
                })
            }
        })
        console.log(erroredDocuments)
    }

    const {
        body: count
    } = await client.count({
        index: 'pageinfo'
    })
    console.log(count)
}


// Search api
async function onSearch(req, res) {
    //console.log('onSearch');

    const searchInput = req.body.searchInput;

    // Let's search!
    const {
        body
    } = await client.search({
        index: 'pageinfo',
        size: 200,
        body: {
            query: {
                match: {
                    //title: `${searchInput}`,
                    mainText: `${searchInput}`
                }
            }
        }
    }, {
        ignore: [404],
        maxRetries: 3
    })

    if (body.hits.hits.length > 0) {
        console.log(body.hits.hits.length)
        for (let i = 0; i < body.hits.hits.length; i++) {
            //console.log(body.hits.hits[i]._source.siteURL)
            //console.log(body.hits.hits[i]._source.pageTitle)
            //console.log(body.hits.hits[i]._source.text)
        }
    }
    res.json(body.hits.hits);
    //res = body.hits.hits;
}
app.post('/api/search', onSearch);

// UpdateInfo api
async function updateInfo(req, res) {

    let body = {
        seenDBTable: seenDBTable,
        successDB: successDB,
        link: link,
        timeSpanTotal: timeSpanTotal,
        failDB: failDB
    };
    res.json(body);
}
app.get('/api/updateInfo', updateInfo);

// updateHistoryInfo api
async function updateHistoryInfo(req, res) {
    const {
        body
    } = await client.get({
        index: 'udb',
        id: '1'
    })
    parselink = JSON.parse(body._source.link);
    const {
        body: count
    } = await client.count({
        index: 'pageinfo'
    })
    console.log(count)
    let resbody = {
        seenDBTable: seenDBTable, //need modify
        successDB: count.count,
        link: parselink,
        timeSpanTotal: timeSpanTotal, //need modify
        failDB: failDB //need modify
    };
    res.json(resbody);
}
app.get('/api/updateHistoryInfo', updateHistoryInfo);

// initialization when restart
async function initialization(link, seenDBTable) {
    await getlink(link);
    await getseenTable(seenDBTable)
    return link, seenDBTable;
}
async function getlink(link) {
    const {
        body
    } = await client.get({
        index: 'udb',
        id: '1'
    })
    parselink = JSON.parse(body._source.link);
    for (let i = 0; i < 100 && parselink.length > 0; i++) {
        link[i] = parselink[0];
        parselink.shift();
    }
    //link = parselink;
    console.log(link)
    console.log(parselink)


    stringlink = JSON.stringify(parselink);
    await client.update({
        index: 'udb',
        id: '1',

        body: {
            doc: {
                link: `${stringlink}`,
            }
        }
    })
    console.log(link)
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(link);
        }, 0);
    });
}
async function getseenTable(seenDBTable) {
    const {
        body
    } = await client.get({
        index: 'seenhashtable',
        id: '1'
    })
    parsetable = JSON.parse(body._source.table);
    seenDBTable = parsetable;
    console.log(seenDBTable)

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(seenDBTable);
        }, 0);
    });
}

// Reset index api
async function resetIndex(req, res) {

    await client.indices.create({
        index: 'pageinfo',
        body: {
            mappings: {
                properties: {
                    crawlTime: {
                        type: 'date'
                    },
                    siteURL: {
                        type: 'text'
                    },
                    hostURL: {
                        type: 'text'
                    },
                    ip: {
                        type: 'text'
                    },
                    domain: {
                        type: 'text'
                    },
                    statusCode: {
                        type: 'integer'
                    },
                    pageDepth: {
                        type: 'integer'
                    },
                    pageTitle: {
                        type: 'text'
                    },
                    mainText: {
                        type: 'text'
                    },
                }
            }
        }
    }, {
        ignore: [400]
    })
    initlink = JSON.stringify(['https://www.ptt.cc/bbs/Gossiping/index.html', 0]);
    await client.index({
        index: 'udb',
        id: '1',
        body: {
            link: initlink
        }
    })
    inittable = JSON.stringify(seenDBTable);
    await client.index({
        index: 'seenhashtable',
        id: '1',
        body: {
            table: inittable
        }
    })
    res.json('reset succeed');
}
app.get('/api/resetIndex', resetIndex);


const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});