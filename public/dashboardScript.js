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

async function showInfo(json) {
    console.log('showInfo')
    const cardTitle1 = document.querySelector('#cardTitle1');
    const cardTitle2 = document.querySelector('#cardTitle2');
    const cardTitle3 = document.querySelector('#cardTitle3');
    
    let seenDBcount = json.seenDBTable.filter(Boolean).length;

    cardTitle1.textContent = seenDBcount;
    cardTitle2.textContent = json.link.length;
    cardTitle3.textContent = json.successDB.length;

}



const updateButton = document.querySelector('#updateButton');
updateButton.addEventListener('click', updateInfo);

setInterval(updateInfo, 1000 * 5);