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

async function showResult(resultJson, searchInputValue) {
    let result = resultJson.searchResult
    let similar = resultJson.searchSimilar;

    console.log(result);
    console.log(resultJson.searchSimilar);
    let resultList = document.querySelector('#searchResult');
    let resultListDiv = document.querySelector('#searchResultDiv');
    let recommendDiv = document.querySelector('#recommend');
    recommendDiv.innerHTML = '<span>相關搜尋：</span>';

    recommendDiv.classList.remove('hidden');
    resultList.innerHTML = '';
    resultListDiv.innerHTML = '';

    for (let i = 0; i < result.length - 1; i++) {
        if (!result[i]._source.siteURL)
            continue;
        if (!result[i] || result[i] === undefined)
            continue;

        if (result[i+1]._source.siteURL) {
            if (result[i+1]._source.siteURL == result[i]._source.siteURL) {
                result.shift();
            }
        }

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

        if (titleIndex >= 0) {
            hnode.innerHTML = titletext.substring(0, titleIndex) + "<span class='highlight'>" + titletext.substring(titleIndex, titleIndex + searchInputValue.length) + "</span>" + titletext.substring(titleIndex + searchInputValue.length);
            //displaytext = displaytext.substring(0,200);
        } else {
            hnode.innerHTML = titletext;
        }

        anode.appendChild(divnode);
        anode.href = `${result[i]._source.siteURL}`;
        displaytext = `${result[i]._source.mainText}`;


        //let searchInputValueSplit = searchInputValue.split(' ');

        var index = displaytext.indexOf(searchInputValue);
        if (index >= 0) {
            pnode.innerHTML = displaytext.substring(index - 100, index) + "<span class='highlight'>" + displaytext.substring(index, index + searchInputValue.length) + "</span>" + displaytext.substring(index + searchInputValue.length, index + 100);
            //console.log(pnode)
            //displaytext = displaytext.substring(0,200);
        } else {
            pnode.innerHTML = displaytext.substring(0, 200);
        }

        divnode.appendChild(hnode);
        divnode.after(pnode);

        resultListDiv.appendChild(anode);
    }
    if(similar) {
        for (let j = 0; j < similar.length; j++) {
            //console.log(similar[j].word)
            var bagenode = document.createElement('span');
            bagenode.classList.add('badge')
            bagenode.classList.add('badge-dark')
            bagenode.setAttribute('id', `badge${j}`);
            bagenode.textContent = `${similar[j].word}`;
            //let recommendBadge = `<span class="badge badge-light">${similar[j].word}</span>`
            recommendDiv.appendChild(bagenode);
            document.getElementById(`badge${j}`).setAttribute('onclick', `recommendSearch('${document.getElementById(`badge${j}`).textContent}')`);
        }
    } else {
        recommendDiv.classList.add('hidden')
    }
}

async function recommendSearch(recommendtext) {
    console.log('recommendSearch');
    console.log(recommendtext);
    const searchInput = document.querySelector('#searchInput');
    searchInput.value = recommendtext;
    const bodyObj = {};
    bodyObj['searchInput'] = recommendtext;

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

    await showResult(resultJson, recommendtext)
}

const searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', onSearch);