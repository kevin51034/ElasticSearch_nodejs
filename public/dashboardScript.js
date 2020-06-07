async function updateInfo() {
    //event.preventDefault();
    console.log('updateInfo');

    const response = await fetch('/api/updateInfo', {
        method: 'GET'
    });
    const json = await response.json();

    console.log(json)
    showInfo(json)
}

async function resetIndex() {
    //event.preventDefault();
    console.log('resetIndex');

    const response = await fetch('/api/resetIndex', {
        method: 'GET'
    });
    const json = await response.json();

    console.log(json)
}

async function showInfo(json) {
    console.log('showInfo')
    const cardTitle1 = document.querySelector('#cardTitle1');
    const cardTitle2 = document.querySelector('#cardTitle2');
    const cardTitle3 = document.querySelector('#cardTitle3');
    const cardTitle4 = document.querySelector('#cardTitle4');
    const cardTitle5 = document.querySelector('#cardTitle5');
    const cardTitle6 = document.querySelector('#cardTitle6');

    let seenDBcount = json.seenDBTable.filter(Boolean).length;

    cardTitle1.textContent = seenDBcount;
    cardTitle2.textContent = json.link.length/2;
    cardTitle3.textContent = json.successDB.length;
    cardTitle4.textContent = json.failDB.length;
    cardTitle5.textContent = (json.successDB.length/json.timeSpanTotal) + '/s';
    cardTitle6.textContent = json.timeSpanTotal + 's';

}

async function updateHistoryInfo() {
    //event.preventDefault();
    console.log('updateHistoryInfo');

    const response = await fetch('/api/updateHistoryInfo', {
        method: 'GET'
    });
    const json = await response.json();

    console.log(json)
    showHistoryInfo(json)

}

async function showHistoryInfo(json) {
    console.log('showInfo')
    const cardTitle7 = document.querySelector('#cardTitle7');
    const cardTitle8 = document.querySelector('#cardTitle8');
    const cardTitle9 = document.querySelector('#cardTitle9');
    const cardTitle10 = document.querySelector('#cardTitle10');
    const cardTitle11 = document.querySelector('#cardTitle11');
    const cardTitle12 = document.querySelector('#cardTitle12');

    let seenDBcount = json.seenDBTable.filter(Boolean).length;

    cardTitle7.textContent = seenDBcount;
    cardTitle8.textContent = json.link.length/2;
    cardTitle9.textContent = json.successDB;
    cardTitle10.textContent = json.failDB.length;
    cardTitle11.textContent = (json.successDB.length/json.timeSpanTotal) + '/s';
    cardTitle12.textContent = json.timeSpanTotal + 's';

}

const updateButton = document.querySelector('#updateButton');
updateButton.addEventListener('click', updateInfo);

const updateHistoryButton = document.querySelector('#updateHistoryButton');
updateHistoryButton.addEventListener('click', updateHistoryInfo);

const resetIndexButton = document.querySelector('#resetIndexButton');
resetIndexButton.addEventListener('click', resetIndex);


setInterval(updateInfo, 1000 * 5);

setInterval(updateHistoryInfo, 1000 * 60 * 5);