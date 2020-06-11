var w2v = require( 'word2vec' );
//const model = require('word2vec/lib/model');

function main() {
    let now = new Date();
    console.log(now);
    //w2v.word2vec('./wiki_seg.txt','./vectors4.txt',size=300,call);

    //test 
    w2v.loadModel( './vectors4.txt', function( error, model ) {
        console.log( model );
        console.log(model.mostSimilar('臺灣',10));
        console.log(model.mostSimilar('日本',10));
        console.log(model.mostSimilar('電腦',10));

        console.log(model.similarity('臺灣','台灣'));
        //console.log(model.getNearestWords(model.getVector('台灣'),5));

    });

}
main();

function call() {
    let now2 = new Date();
    console.log(now2);
    //console.log(model);
    w2v.loadModel( './vectors4.txt', function( error, model ) {
        console.log( model );
    });
}
