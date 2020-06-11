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
    let result = resultJson.searchResult
    console.log(result);
    console.log(resultJson.searchSimilar);
    let resultList = document.querySelector('#searchResult');
    let resultListDiv = document.querySelector('#searchResultDiv');

        resultList.innerHTML = '';
        resultListDiv.innerHTML = '';

    for(let i=0;i<result.length;i++){
        if(!result[i]._source.siteURL)
            continue;
        if(i<result.length-1){
            if(result[i++]._source.siteURL) {
                if(result[i++]._source.siteURL == result[i]._source.siteURL) {
                    result.shift();
                }
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

        let titletext = `${result[i]._source.pageTitle}`

        var titleIndex = titletext.indexOf(searchInputValue);

        if(titleIndex >= 0) {
            hnode.innerHTML = titletext.substring(0, titleIndex) + "<span class='highlight'>" + titletext.substring(titleIndex,titleIndex+searchInputValue.length) + "</span>" + titletext.substring(titleIndex + searchInputValue.length);
            //displaytext = displaytext.substring(0,200);
        } else {
            hnode.innerHTML = titletext;
        }



        anode.appendChild(divnode);
        anode.href = `${result[i]._source.siteURL}`;
        displaytext = `${result[i]._source.mainText}`;


        //let searchInputValueSplit = searchInputValue.split(' ');

        var index = displaytext.indexOf(searchInputValue);
        if(index>=0) {
            pnode.innerHTML = displaytext.substring(index-100, index) + "<span class='highlight'>" + displaytext.substring(index,index+searchInputValue.length) + "</span>" + displaytext.substring(index + searchInputValue.length, index+100);
            //console.log(pnode)
            //displaytext = displaytext.substring(0,200);
        } else {
            pnode.innerHTML = displaytext.substring(0,200);
        }

        //var highlightnode = document.createElement('span'); //create a <a> tag
        //highlightnode.classList.add('highlight')

/*
        while(displaytext.indexOf(searchInputValue)) {
            var index = displaytext.indexOf(searchInputValue);
            if (index >= 0) { 
                //highlightnode.textContent = displaytext.substring(index,index+searchInputValue.length)
                //displaytext = displaytext.substring(0,index) + highlightnode + displaytext.substring(index + searchInputValue.length);
    
                pnode.innerHTML = displaytext.substring(0,index) + "<span class='highlight'>" + displaytext.substring(index,index+searchInputValue.length) + "</span>" + displaytext.substring(index + searchInputValue.length);
            }
        }*/


        //pnode.textContent = displaytext
        divnode.appendChild(hnode);
        divnode.after(pnode);

        resultListDiv.appendChild(anode);




    
    }}

const searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', onSearch);