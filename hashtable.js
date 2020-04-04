function djb2HashCode(key) {

    // 初始化 hash 值，大部分實作使用 5381
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
        // 根據經驗值給個魔術數字 33
        hash = hash * 33 + key.charCodeAt(i);
    }
    // 1013 為隨機質數
    return hash % 3571;
}

function put(key, value, table) {
    //console.log(key)
    //console.log(value)
    let position = djb2HashCode(key);
    // 若是位置沒被佔據直接 new 一個 ValuePair，若有則考慮下一個 index
    if (table[position] === undefined) {
        //console.log('insert')
        table[position] = {
            key,
            value
        };
        //console.log(position)
    } else {
        //console.log('collision')
        //console.log(position)
        if (table[position].key === key) {
            //console.log('URL seen')
            return;
        }
        let index = ++position;
        while (table[index] !== undefined) {
            if (table[index].key === key) {
                //console.log('URL seen')
                return;
            }
            index++;
        }
        //console.log('insert2')
        table[index] = {
            key,
            value
        };
    }
}


module.exports = {
    djb2HashCode,
    put,
}


function HashTable() {
    let table = [];
    // 實作內部一個 ValuePair 類別，存原始 key、value  
    let ValuePair = function (key, value) {
        this.key = key;
        this.value = value;
    }
    /*
    let getHashTableCode = function (key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            // charCodeAt 會回傳指定字串內字元的 Unicode 編碼（可以包含中文字）
            hash += key.charCodeAt(i);
        }
        // 為了取到較小值，使用任意數做除法 mod 處理
        return hash % 37;
    }*/

    // djb2HashCode 實作
    let djb2HashCode = function (key) {
        // 初始化 hash 值，大部分實作使用 5381
        let hash = 5381;
        for (let i = 0; i < key.length; i++) {
            // 根據經驗值給個魔術數字 33
            hash = hash * 33 + key.charCodeAt(i);
        }
        // 1013 為隨機質數
        return hash % 31;
    }

    // 由於 JavaScript 陣列可動態增加長度，所以不用擔心長度不夠問題
    this.put = function (key, value) {
        console.log(key)
        console.log(value)
        let position = djb2HashCode(key);
        // 若是位置沒被佔據直接 new 一個 ValuePair，若有則考慮下一個 index
        if (table[position] === undefined) {
            table[position] = new ValuePair(key, value);
        } else {
            let index = ++position;
            while (table[index] !== undefined) {
                index++;
            }
            table[index] = new ValuePair(key, value);
        }
    }
    this.get = function (key) {
        let position = djb2HashCode(key);
        // 先確認鍵值是否存在
        if (table[position] !== undefined) {
            // 開始比對，沒有就下一個
            if (table[position].key === key) {
                return table[position].value;
            } else {
                let index = ++position;
                while (table[index] === undefined || table[index].key !== key) {
                    index++;
                }
                if (table[index].key === key) {
                    console.log(table[index].value);
                    return table[index].value;
                }
            }
        }
        return undefined;
    }
    this.remove = function (key) {
        let position = djb2HashCode(key);
        // 先確認鍵值是否存在
        if (table[position] !== undefined) {
            // 開始比對，沒有就下一個
            if (table[position].key === key) {
                table[index] = undefined;
            } else {
                let index = ++position;
                while (table[index] === undefined || table[index].key !== key) {
                    index++;
                }
                if (table[index].key === key) {
                    table[index] = undefined;
                }
            }
        }
        return undefined;
    }
    this.display = function () {
        for (let i = 0; i < table.length; i++) {
            console.log(table[i]);
        }
    }
}