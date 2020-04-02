const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const md5 = require('md5');

var HashTable = require('./hashtable.js');

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

const url1 = 'https://github.com/'
//const url = 'https://www.ptt.cc/bbs/Gossiping/index.html'
//const table = new Int32Array(100);
const link = [url1];
const seenDBTable = [];

//let count = 0;

// TODO: need to check if there is link in the UDB first
function crawler() {
    for (let count = 0; link.length > 0 && count < 10; count++) {
        console.log(count)
        let url = link[count];
        console.log(link[0]);
        //link.shift();
        console.log('while loop = ' + ' ' + `${count}`);
        console.log('link arrat -> ');
        console.log(link[0]);
        console.log(count);
        console.log(link[count]);

        console.log(url);

        //console.log(link[++count]);
        if(link[count]) {
            dorequest(url,count)
        }

        //count++;
        console.log('no wait')
        setTimeout(() => {
            console.log('wait 5s');
        }, 5000);
        //console.log(link.length)
        //console.log(count)
    }
}

crawler();

function dorequest(url,count) {
    request({
        url,
        headers: {
            Cookie: "over18=1;"
        }
    }, (err, res, body) => {
        console.log('Crawling  -> ' + `${url}`)
        console.log('request number: ' + `${count}`)

        const myURL = new URL(`${url}`);
        //console.log(myURL)
        const hostUrl = (myURL.protocol + '//' + myURL.host);
        //console.log(hostUrl);

        fs.writeFile('body.txt', `${body}`, function (err) {
            if (err)
                console.log(err);
            else
                console.log('Write operation complete.');
        });
        const $ = cheerio.load(body)

        //console.log($.html());

        // select all link
        //   let link = [];
        let linkmd5 = [];
        let hashKey = [];

        $('a').each(function (i, elem) {
            if ($(this).attr('href')) {
                link.push($(this).attr('href'));
                thisurl = $(this).attr('href').startsWith('http') ? $(this).attr('href') : (hostUrl + $(this).attr('href'));
                //console.log(thisurl);
                link.push(thisurl);
                //console.log(md5(thisurl));
                linkmd5.push(md5(thisurl));
                //hashKey.push(djb2Hash(md5(thisurl)))
                //console.log(djb2Hash(md5(thisurl)));
                //console.log(djb2Hash(md5(thisurl)) % (64 * 256 * 2 - 1));
                //hashKeymod = djb2Hash(md5(thisurl)) % (64 * 256 * 2 - 1);
                //seenDB[hashKeymod] = md5(thisurl);
                HashTable.put(md5(thisurl), thisurl, seenDBTable);

            }


        })
        //console.log(link)

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
        fs.writeFile('djb2HashKey.txt', `${hashKey}`, function (err) {
            if (err)
                console.log(err);
            else
                console.log('Write operation complete.');
        });

        var obj = {
            table: seenDBTable
        };
        let outputObj = JSON.stringify(obj);
        fs.writeFile('seenhashTable.json', `${outputObj}`, function (err) {
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
}


/*
function djb2Hash(str) {
    var len = str.length;
    var hash = 5381;
    for (var idx = 0; idx < len; ++idx) {
        hash = 33 * hash + str.charCodeAt(idx);
    }
    return hash;
}

function ValuePair(key, value) {
    this.key = key;
    this.value = value;
}*/
/*
function djb2HashCode(key) {
    // 初始化 hash 值，大部分實作使用 5381
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
        // 根據經驗值給個魔術數字 33
        hash = hash * 33 + key.charCodeAt(i);
    }
    // 1013 為隨機質數
    return hash % 1013;
}

function put(key, value) {
    console.log('put')
    console.log(key)
    console.log(value)
    let position = djb2HashCode(key);
    // 若是位置沒被佔據直接 new 一個 ValuePair，若有則考慮下一個 index

    console.log(typeof table[position])
    console.log(table[position])

    if (table[position] === undefined) {
        console.log('insert')
        table[position] = {key, value};
        console.log(position)
        //console.log(table[position]);
    } else {
        console.log('collision')
        console.log(position)

        let index = ++position;
        while (table[index] !== undefined) {
            index++;
        }
        table[index] = {key, value};
        //console.log(table[index]);

    }
    
}

function HashTable() {
    //let table = [];
    // 實作內部一個 ValuePair 類別，存原始 key、value  
    let ValuePair = function (key, value) {
        this.key = key;
        this.value = value;
    }
    /*
    let getHashTableCode = function (key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            // charCodeAt 會回傳指定字串內字元的 Unicode 編碼（可以包含中文字）
            hash += key.charCodeAt(i);
        }
        // 為了取到較小值，使用任意數做除法 mod 處理
        return hash % 37;
    }

    // djb2HashCode 實作
    let djb2HashCode = function (key) {
        // 初始化 hash 值，大部分實作使用 5381
        let hash = 5381;
        for (let i = 0; i < key.length; i++) {
            // 根據經驗值給個魔術數字 33
            hash = hash * 33 + key.charCodeAt(i);
        }
        // 1013 為隨機質數
        return hash % 31;
    }

    // 由於 JavaScript 陣列可動態增加長度，所以不用擔心長度不夠問題
    this.put = function (key, value) {
        console.log(key)
        console.log(value)
        let position = djb2HashCode(key);
        // 若是位置沒被佔據直接 new 一個 ValuePair，若有則考慮下一個 index
        if (table[position] === undefined) {
            table[position] = new ValuePair(key, value);
        } else {
            let index = ++position;
            while (table[index] !== undefined) {
                index++;
            }
            table[index] = new ValuePair(key, value);
        }
    }
    this.get = function (key) {
        let position = djb2HashCode(key);
        // 先確認鍵值是否存在
        if (table[position] !== undefined) {
            // 開始比對，沒有就下一個
            if (table[position].key === key) {
                return table[position].value;
            } else {
                let index = ++position;
                while (table[index] === undefined || table[index].key !== key) {
                    index++;
                }
                if (table[index].key === key) {
                    console.log(table[index].value);
                    return table[index].value;
                }
            }
        }
        return undefined;
    }
    this.remove = function (key) {
        let position = djb2HashCode(key);
        // 先確認鍵值是否存在
        if (table[position] !== undefined) {
            // 開始比對，沒有就下一個
            if (table[position].key === key) {
                table[index] = undefined;
            } else {
                let index = ++position;
                while (table[index] === undefined || table[index].key !== key) {
                    index++;
                }
                if (table[index].key === key) {
                    table[index] = undefined;
                }
            }
        }
        return undefined;
    }
    this.display = function(){
        for(let i=0;i<table.length;i++){
            console.log(table[i]);
        }
    }
}*/




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