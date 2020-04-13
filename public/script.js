async function onSearch() {
    event.preventDefault();
    console.log('onSearch');

    const searchInput = document.querySelector('#searchInput');
    const searchInputValue = searchInput.value.trim();
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

    await showResult(resultJson, searchInputValue)
}

function showResult(resultJson, searchInputValue) {
    let resultList = document.querySelector('#searchResult');
    let resultListDiv = document.querySelector('#searchResultDiv');

        resultList.innerHTML = '';
        resultListDiv.innerHTML = '';

    for(let i=0;i<resultJson.length;i++){
        if(!resultJson[i]._source.URL)
            continue;
        if(resultJson[i++]._source.URL) {
            if(resultJson[i++]._source.URL == resultJson[i]._source.URL) {
                resultJson.shift();
            }
        }


        //var linode = document.createElement('li');                 // Create a <li> node
        //var anode = document.createElement('a'); //create a <a> tag
        //anode.textContent = `${resultJson[i]._source.title}`; //set <a> tag's text
        //anode.href = `${resultJson[i]._source.URL}`;
        //linode.appendChild(anode);  //Append the <a> tag                            
        //resultList.appendChild(linode);
        //resultList.append(`<li class="list-group-item"><a href=${resultJson[i]._source.URL}>${resultJson[i]._source.title}</a></li>`)
    
        var anode = document.createElement('a'); //create a <a> tag
        var divnode = document.createElement('div'); //create a <a> tag
        var hnode = document.createElement('h5');
        var pnode = document.createElement('p');
        anode.classList.add('list-group-item')
        anode.classList.add('list-group-item-action')

        divnode.classList.add('d-flex')
        divnode.classList.add('w-100')
        divnode.classList.add('justify-content-between')
        hnode.classList.add('mb-1')
        pnode.classList.add('mb-1')

        hnode.textContent = `${resultJson[i]._source.title}`
        anode.appendChild(divnode);
        anode.href = `${resultJson[i]._source.URL}`;
        displaytext = `${resultJson[i]._source.text}`;
        if(displaytext.length > 200) {
            displaytext = displaytext.substring(0,200);
        }

        //var highlightnode = document.createElement('span'); //create a <a> tag
        //highlightnode.classList.add('highlight')


        /*while(displaytext.indexOf(searchInputValue)) {
            var index = displaytext.indexOf(searchInputValue);
            if (index >= 0) { 
                //highlightnode.textContent = displaytext.substring(index,index+searchInputValue.length)
                //displaytext = displaytext.substring(0,index) + highlightnode + displaytext.substring(index + searchInputValue.length);
    
                pnode.innerHTML = displaytext.substring(0,index) + "<span class='highlight'>" + displaytext.substring(index,index+searchInputValue.length) + "</span>" + displaytext.substring(index + searchInputValue.length);
            }
        }*/


        pnode.textContent = displaytext
        divnode.appendChild(hnode);
        divnode.after(pnode);

        resultListDiv.appendChild(anode);




    
    }}

const searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', onSearch);