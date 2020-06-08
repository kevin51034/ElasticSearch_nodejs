async function updateInfo() {
    //event.preventDefault();
    console.log('updateInfo');

    const response = await fetch('/api/updateInfo', {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });
    const json = await response.json();

    console.log(json)
    showInfo(json)
}

async function resetIndex() {
    //event.preventDefault();
    console.log('resetIndex');

    const response = await fetch('/api/resetIndex', {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
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
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
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

async function updateTable() {
    const response = await fetch('/api/getDatatable', {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });
    const json = await response.json();
    console.log(json)
    //const info = getParameters();
    //const response = await fetch(info.path, info.options);
    //const json = await response.json();

    $('#datatable').DataTable().destroy();
    //$('#datatable').DataTable().empty();

    $('#datatable').DataTable({
        dom: 'lBfrtip',
        /*buttons: [
            'copy', 'csv', 'excel', 'print', 'colvis', //'pdf'
        ],*/
        
        data: json.tablebody,
        columns: [{
                data: 'hostURL'
            },
            {
                data: 'count'
            },
            {
                data: 'ipcount'
            },
            {
                data: 'ip'
            },
            {
                data: 'domaincount'
            },
            /*{
                data: 'domain'
            },*/
        ],

        // select search
        initComplete: function () {
            this.api().columns().every(function () {
                var column = this;
                var select = $('<select><option value=""></option></select>')
                    .appendTo($(column.footer()).empty())
                    .on('change', function () {
                        var val = $.fn.dataTable.util.escapeRegex(
                            $(this).val()
                        );
                        column
                            .search(val ? '^' + val + '$' : '', true, false)
                            .draw();
                    });
                column.data().unique().sort().each(function (d, j) {
                    select.append('<option value="' + d + '">' + d + '</option>')
                });
            });
        },
    });

    // text search
    /*$('input.global_filter').on('keyup click', function () {
        filterGlobal();
    });

    $('input.column_filter').on('keyup click', function () {
        filterColumn($(this).parents('tr').attr('data-column'));
    });

    resultsDiv.textContent = JSON.stringify(json, null, 2);*/
    //console.log(resultsDiv.textContent);

    //const resultsContainer = document.querySelector('#results-container');
    //resultsContainer.classList.remove('hidden');
    const datatable = document.querySelector('#datatable');
    datatable.classList.remove('hidden');

    /*const filterButtondiv = document.querySelector('#filterButtondiv');
    filterButtondiv.classList.remove('hidden');
    loading.classList.add('hidden');*/
}

async function showHomeSection() {
    dataSection.classList.add('hidden');
    statusSection.classList.remove('hidden');
}

async function showDataSection() {
    statusSection.classList.add('hidden');
    dataSection.classList.remove('hidden');
}

const updateButton = document.querySelector('#updateButton');
updateButton.addEventListener('click', updateInfo);

const updateHistoryButton = document.querySelector('#updateHistoryButton');
updateHistoryButton.addEventListener('click', updateHistoryInfo);

const resetIndexButton = document.querySelector('#resetIndexButton');
resetIndexButton.addEventListener('click', resetIndex);

const navHome = document.querySelector('#navHome');
navHome.addEventListener('click', showHomeSection);

const navData = document.querySelector('#navData');
navData.addEventListener('click', showDataSection);

const statusSection = document.querySelector('#statusSection');
const dataSection = document.querySelector('#dataSection');

const updateTableButton = document.querySelector('#updateTableButton');
updateTableButton.addEventListener('click', updateTable);


setInterval(updateInfo, 1000 * 5);

setInterval(updateHistoryInfo, 1000 * 60 * 5);