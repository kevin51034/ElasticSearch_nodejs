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

}

const searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', onSearch);