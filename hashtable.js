function djb2HashCode(value) {

    // 初始化 hash 值，大部分實作使用 5381
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
        // 根據經驗值給個魔術數字 33
        hash = hash * 33 + value.charCodeAt(i);
    }
    // 1013 為隨機質數
    return hash % 16127;
}

function put(value, table) {
    //console.log(key)
    //console.log(value)
    let key = djb2HashCode(value);
    // 若是位置沒被佔據直接 new 一個 ValuePair，若有則考慮下一個 index
    if (table[key] === undefined) {
        //console.log('insert')
        table[key] = value;
        return 0;
        //console.log(key)
    } else {
        //console.log('collision')
        //console.log(key)
        if (table[key] === value) {
            //console.log('URL seen')
            return 1;
        }
        let index = ++key;
        while (table[index] !== undefined) {
            if (table[index] === value) {
                //console.log('URL seen')
                return 1;
            }
            index++;
        }
        //console.log('insert2')
        table[index] = value;
        return 0;
    }
}


module.exports = {
    djb2HashCode,
    put,
}
