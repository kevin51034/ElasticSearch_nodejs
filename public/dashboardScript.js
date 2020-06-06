async function updateInfo() {
    //event.preventDefault();
    console.log('updateInfo');


    //const bodyObj = {};
    //bodyObj[searchInput.name] = searchInput.value.trim();


    /*options.body = JSON.stringify(bodyObj);
    options.headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };*/

    const response = await fetch('/api/updateInfo', {
        method: 'GET'
    });
    const json = await response.json();

    console.log(json)
    showInfo(json)
    //await showResult(resultJson, searchInputValue)
}

async function resetIndex() {
    //event.preventDefault();
    console.log('resetIndex');


    //const bodyObj = {};
    //bodyObj[searchInput.name] = searchInput.value.trim();


    /*options.body = JSON.stringify(bodyObj);
    options.headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };*/

    const response = await fetch('/api/resetIndex', {
        method: 'GET'
    });
    const json = await response.json();

    console.log(json)
    //showInfo(json)
    //await showResult(resultJson, searchInputValue)
}

async function showInfo(json) {
    console.log('showInfo')
    const cardTitle1 = document.querySelector('#cardTitle1');
    const cardTitle2 = document.querySelector('#cardTitle2');
    const cardTitle3 = document.querySelector('#cardTitle3');
    const cardTitle5 = document.querySelector('#cardTitle5');
    const cardTitle6 = document.querySelector('#cardTitle6');

    let seenDBcount = json.seenDBTable.filter(Boolean).length;

    cardTitle1.textContent = seenDBcount;
    cardTitle2.textContent = json.link.length/2;
    cardTitle3.textContent = json.successDB.length;
    cardTitle5.textContent = (json.successDB.length/json.timeSpanTotal) + '/s';

    cardTitle6.textContent = json.timeSpanTotal + 's';

}



const updateButton = document.querySelector('#updateButton');
updateButton.addEventListener('click', updateInfo);

const resetIndexButton = document.querySelector('#resetIndexButton');
resetIndexButton.addEventListener('click', resetIndex);


setInterval(updateInfo, 1000 * 5);