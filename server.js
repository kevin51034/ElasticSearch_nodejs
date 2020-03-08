const express = require('express');

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


const {
    Client
} = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

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

    // Let's search!
    /*const {
        body
    } = await client.search({
        //index: 'game-of-thrones',
        index: '.kibana_1',

         //type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
        body: {
            query: {
                match_all: {
                    //quote: 'winter'
                }
            }
        }
    })*/
    const { body } = await client.get({
        index: 'my-index',
        id: '1'
    })
    console.log(body)

    //console.log(body.hits.hits)
}

run().catch(console.log)

const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});