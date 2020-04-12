async function onSearch() {
    event.preventDefault();
    console.log('onSearch');

    const searchInput = document.querySelector('#searchInput');
    console.log(searchInput.value.trim())

    const bodyObj = {};
    bodyObj[searchInput.name] = searchInput.value.trim();

    const options = {
        method: 'POST'
    };
    const path = '/api/search';

    options.body = JSON.stringify(bodyObj);
    options.headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const response = await fetch(path, options);
    const resultJson = await response.json();
    console.log(resultJson)

    await showResult(resultJson)
}

async function showResult(resultJson) {
    let resultList = document.querySelector('#searchResult');

    for(let i=1;i<resultList.childNodes.length;i++) {
        resultList.removeChild(resultList.childNodes[i]); 
    }

    for(let i=0;i<resultJson.length;i++){
        var linode = document.createElement('li');                 // Create a <li> node
        var anode = document.createElement('a'); //create a <a> tag
        anode.textContent = `${resultJson[i]._source.title}`; //set <a> tag's text
        anode.href = `${resultJson[i]._source.URL}`;
        linode.appendChild(anode);  //Append the <a> tag                            
        resultList.appendChild(linode);
        //resultList.append(`<li class="list-group-item"><a href=${resultJson[i]._source.URL}>${resultJson[i]._source.title}</a></li>`)
    }}

const searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', onSearch);