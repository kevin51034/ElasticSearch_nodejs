const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const md5 = require('md5');
const dns = require('dns');
const rp = require('request-promise');

var HashTable = require('./hashtable.js');
var moment = require('moment');
var w2v = require( 'word2vec' );

//Elastic Search

const {
    Client
} = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

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
var modelglobal;
w2v.loadModel( './word2vec/vectors4.txt', function( error, model ) {
    console.log('model load succeed')
    console.log( model );
    modelglobal = model;
});

async function main() {

    await delay(30000);
    console.log(modelglobal);
    // initialization
    //initialization(link, seenDBTable);
    await getlink(link);
    await getseenTable(seenDBTable);

    await delay(3000);
    //console.log(link);
    console.log(seenDBTable);

    var startTime = moment().format();
    console.log(startTime);
    batchCrawler();

    //console.log(link);
    console.log('success URL number: ' + successDB.length);
    for (let i = 0; i < 100; i++) {
        var timeSpan = moment();
        console.log('time span : ')
        console.log(timeSpan.diff(startTime, 'seconds'));
        timeSpanTotal = timeSpan.diff(startTime, 'seconds')
        batchCrawler();
        await delay(5000);

        console.log('success URL number: ' + successDB.length);

        var batchTime = moment().format();
        console.log('batch time : ')
        console.log(batchTime)
        //console.log(seenDBTable);

        if (bulkBody.length > 1500) {
            console.log('request bulk')
            storePageInfoBulk(bulkBody);
            bulkBody = [];
            storeDB(link, seenDBTable);
            updateFailDB(failDB);
        }

        await delay(5000);

    }
    console.log(crawlercount);
    //batchCrawler();
}
//main();


// batch process
async function batchCrawler() {
    for (let count = 0; link.length > 0 && count < 150; count++) {
        crawlercount++;
        if (link[count]) {
            if(!isNaN(link[0])) {
                link.shift();
            }
            let url = link[0];
            let depth = ++link[1];
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
        //await delay(1000);

        if (!body) {
            return 0;
        }
        const $ = cheerio.load(body)
        //console.log($.html());
        //let linkmd5 = [];
        let pageTitle = $("title").text();
        objInfo['pageTitle'] = pageTitle;

        $('a').each(function (i, elem) {
            if ($(this).attr('href')) {
                //link.push($(this).attr('href'));
                thisurl = $(this).attr('href').startsWith('http') ? $(this).attr('href') : (hostUrl + $(this).attr('href'));
                //let seen = HashTable.put(md5(thisurl), thisurl, seenDBTable);
                let seen = HashTable.put(md5(thisurl), seenDBTable);
                if (seen === 0) {
                    link.push(thisurl, depth);
                    //linkmd5.push(md5(thisurl));
                }
            }
        })

        if (objInfo['hostURL'] == 'https://www.ptt.cc' && $('#main-content')) {
            // ptt main content
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
            // select all text
            let text = '';
            $('div').map(function (i, elem) {
                if ($(this).text().length > text.length) {
                    text = '';
                    text = $(this).text().replace(/^\s+|\s+$/gm, '');
                }
            })
            objInfo['mainText'] = text;
        }
        successDB.push(myURL);
        bulkBody.push(objInfo);
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
    // this link URL number < 100
    if (link.length < 200) {
        const {
            body
        } = await client.get({
            index: 'udb',
            id: '1'
        })
        let parselink = JSON.parse(body._source.link);
        for (let i = 0; i < 200 && parselink.length > 0; i++) {
            link.push(parselink[0]);
            parselink.shift();
        }
        let stringlink = JSON.stringify(parselink);

        await client.update({
            index: 'udb',
            id: '1',
            body: {
                doc: {
                    link: `${stringlink}`,
                }
            }
        })
        let jsontable = JSON.stringify(seenDBTable);
        await client.update({
            index: 'seenhashtable',
            id: '1',
            body: {
                doc: {
                    table: `${jsontable}`,
                }
            }
        })
    }
    // this URL number > 5000
    // push URL after 100 back into UDB index
    else if (link.length > 10000) {
        console.log('push URL back to UDB')
        const {
            body
        } = await client.get({
            index: 'udb',
            id: '1'
        })
        let parselink = JSON.parse(body._source.link);
        let templink = link.slice(199);
        link.splice(200);
        Array.prototype.push.apply(parselink, templink);

        let stringlink = JSON.stringify(parselink);
        await client.update({
            index: 'udb',
            id: '1',
            body: {
                doc: {
                    link: `${stringlink}`,
                }
            }
        })
        let jsontable = JSON.stringify(seenDBTable);
        await client.update({
            index: 'seenhashtable',
            id: '1',
            body: {
                doc: {
                    table: `${jsontable}`,
                }
            }
        })
    }
    // this URL > 100 && URL < 5000
    /*
    else {
        jsonlink = JSON.stringify(link);
        jsontable = JSON.stringify(seenDBTable);
        await client.update({
            index: 'udb',
            id: '1',
            body: {
                doc: {
                    link: `${jsonlink}`,
                }
            }
        })
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
    }*/
}

async function updateFailDB(failDB) {

        const {
            body
        } = await client.get({
            index: 'faildb',
            id: '1'
        })
        let parsefailDB = JSON.parse(body._source.failURL);
        Array.prototype.push.apply(parsefailDB, failDB);
        let stringFailDB = JSON.stringify(parsefailDB);

        await client.update({
            index: 'faildb',
            id: '1',
            body: {
                doc: {
                    failURL: `${stringFailDB}`,
                }
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
    await client.indices.refresh({
            index: 'pageinfo'
    })
    const {
        body: count
    } = await client.count({
        index: 'pageinfo'
    })
    console.log(count)
}


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
    let parselink = JSON.parse(body._source.link);
    if (!isNaN(parselink[0])) {
        parselink.shift();
    }
    for (let i = 0; i < 100 && parselink.length > 0; i++) {
        link[i] = parselink[0];
        parselink.shift();
    }
    let stringlink = JSON.stringify(parselink);
    await client.update({
        index: 'udb',
        id: '1',
        body: {
            doc: {
                link: `${stringlink}`,
            }
        }
    })
    //console.log(link)
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


// Search api
async function onSearch(req, res) {

    //model.similarity( 'ham', 'cheese' );

    //console.log('onSearch');
    const searchInput = req.body.searchInput;
    // Let's search!
    let searchSimilar = modelglobal.mostSimilar(`${searchInput}`,10);

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
    res.json(resbody = {
        searchResult: body.hits.hits,
        searchSimilar: searchSimilar
    });
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
    initfailDB = JSON.stringify(failDB);
    await client.index({
        index: 'faildb',
        id: '1',
        body: {
            failURL: initfailDB
        }
    })
    res.json('reset succeed');
}
app.get('/api/resetIndex', resetIndex);


// getDatatable api
async function getDatatable(req, res) {
    console.log('getdatatable')
    const response = await client.search({
        index: 'pageinfo',
        // keep the search results "scrollable" for 30 seconds
        //scroll: '30s',
        // for the sake of this example, we will get only one result per search
        size: 10000,
        // filter the source to only include the quote field
        _source: ['hostURL','ip','domain'],
        body: {
            query: {
                match_all: {}
            }
        }
    })
    console.log(response.body.hits.hits);
    let tablebody = [];
    let hostarray = [];
    for(let i=0;i<response.body.hits.hits.length;i++) {
        if(hostarray.includes(response.body.hits.hits[i]._source.hostURL)) {
            //tablebody[`${response.body.hits.hits[i]._source.hostURL}`].count++;
            for(let j=0;j<tablebody.length;j++){
                if(tablebody[j].hostURL == response.body.hits.hits[i]._source.hostURL) {
                    tablebody[j].count++;
                    if(!tablebody[j].ip.includes(`${response.body.hits.hits[i]._source.ip}`)) {
                        tablebody[j].ip.push(`${response.body.hits.hits[i]._source.ip}`);
                        tablebody[j].ipcount=tablebody[j].ip.length;
                    }
                    if(response.body.hits.hits[j]._source.domain) {
                        if(!tablebody[j].domain.includes(`${response.body.hits.hits[i]._source.domain}`)) {
                            tablebody[j].domain.push(`${response.body.hits.hits[i]._source.domain}`);
                            tablebody[j].domaincount=tablebody[j].domain.length;
                        }
                    }

                }
            }
            //if(!tablebody[`${response.body.hits.hits[i]._source.hostURL}`].ip.includes(`${response.body.hits.hits[i]._source.ip}`)) {
            //    tablebody[`${response.body.hits.hits[i]._source.hostURL}`].ip.push(`${response.body.hits.hits[i]._source.ip}`);
            //}
        }
        else {
            let tempdomain = []
            hostarray.push(response.body.hits.hits[i]._source.hostURL)
            if(response.body.hits.hits[i]._source.domain) {
                tempdomain.push(response.body.hits.hits[i]._source.domain);
            }
            tablebody.push({
                hostURL:`${response.body.hits.hits[i]._source.hostURL}`,
                count: 1,
                ipcount: 1,
                ip: [`${response.body.hits.hits[i]._source.ip}`],
                domaincount: 0,
                domain: tempdomain
            })
            //tablebody[`${response.body.hits.hits[i]._source.hostURL}`] = {};
            //tablebody[`${response.body.hits.hits[i]._source.hostURL}`].count = 1;
            //tablebody[`${response.body.hits.hits[i]._source.hostURL}`].ip = [`${response.body.hits.hits[i]._source.ip}`];

        }
    }

    //console.log(hostarray);
    //console.log(hostarray.length);
    //console.log(tablebody);

    /*
    const {
        body
    } = await client.get({
        index: 'pageinfo',
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
    };*/

    let resbody = {
        tablebody: tablebody
    }
    //await delay(3000)

    console.log('res')
    //console.log(tablebody)
    //console.log(resbody)
    //console.log(resbody.tablebody)

    //TODO: fix res json is empty
    res.json(resbody);

}
app.get('/api/getDatatable', getDatatable);

async function outputFile() {
    /*
    let outputInfoDB = JSON.stringify(pageInfoDB);
    fs.writeFile(`./pageInfoDB.json`, `${outputInfoDB}`, function (err) {
        if (err)
            console.log(err);
        else
            console.log('Write operation complete.');
    });*/

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

}


const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});