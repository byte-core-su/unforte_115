// 維護用解答保留供自動驗證；學生介面只提供一星完整解答。
const t = (name, input, expected, extra = {}) => ({ name, input: String(input), expected: String(expected), ...extra });
const numeric = { numeric: true };
const forLoop = { requires: ['For'] };
const nestedLoop = { requires: ['For'], nestedFor: true };
const whileLoop = { requires: ['While'] };
const functions = { requires: ['FunctionDef'] };
const upgrade = (tier, title, task, solution, tests, hints, input, starter, syntax = []) => ({ tier, title, task, solution, tests, hints, input, starter, syntax, expected: '', optional: tier === 3 });
const table = (rows, columns) => Array.from({ length: rows }, (_, i) => Array.from({ length: columns }, (_, j) => `${i + 1} * ${j + 1} = ${(i + 1) * (j + 1)}`).join('\n')).join('\n');
const frame = n => Array.from({ length: n }, (_, row) => row === 0 || row === n - 1 ? '*'.repeat(n) : '*' + ' '.repeat(n - 2) + '*').join('\n');
const evenSum = n => { const count = Math.floor(n / 2); return count * (count + 1); };
const multiplesSum = (start, end) => { let sum = 0; for (let i = start; i <= end; i++) if (i % 3 === 0) sum += i; return sum; };
const advanced = {
  1: [
    upgrade(2, '進階：把三句話接成一行', '把初階的三行輸出改為一行：「我會觀察 | 我會修改 | 我會驗證」。請用一次 print()，透過 sep=" | " 分隔三個文字參數。', 'print("我會觀察", "我會修改", "我會驗證", sep=" | ")', [t('同一行的三個訊息', '', '我會觀察 | 我會修改 | 我會驗證', { printKeyword: 'sep' })], ['先比較原題與新題的換行方式。', 'print() 可以放三個文字參數；sep 決定中間的分隔符號。'], ''),
    upgrade(3, '終極：控制換行的小海報', '用三次 print() 輸出兩行：第一行「Python / Lab」，第二行「一起探索！」。第一次 print("Python", ...) 請用 end=" / "，第二次印 Lab，第三次印邀請語。', 'print("Python", end=" / ")\nprint("Lab")\nprint("一起探索！")', [t('分隔與換行各有用途', '', 'Python / Lab\n一起探索！', { printKeyword: 'end' })], ['end 決定這次輸出後如何結尾。', '第一個 print 不換行；第二個 print 恢復預設換行。'], '', '# 完成三次輸出，第一個 print 需要調整 end\nprint("Python")\nprint("Lab")\nprint("一起探索！")')
  ],
  2: [
    upgrade(2, '進階：重排班級名牌', '沿用初階的兩行輸入：班級、姓名。改成輸出兩行：第一行「姓名：小安」，第二行「班級：七年一班」。冒號後不留空格，內容隨輸入改變。', 'class_name = input()\nname = input()\nprint("姓名：", name, sep="")\nprint("班級：", class_name, sep="")', [t('交換顯示順序', '七年一班\n小安', '姓名：小安\n班級：七年一班'), t('英文姓名', '八年二班\nAlex', '姓名：Alex\n班級：八年二班'), t('保留名字中的空格', '九年三班\nAmy Chen', '姓名：Amy Chen\n班級：九年三班')], ['讀取的順序仍是班級、姓名；顯示的順序改為姓名、班級。', '用 sep="" 組合標籤與變數。'], '七年一班\n小安'),
    upgrade(3, '終極：三筆資料的識別證', '依序輸入班級、姓名、工作。第一行輸出「[班級] 姓名」，第二行輸出「工作：工作內容」，內容都要來自輸入。', 'class_name = input()\nname = input()\nrole = input()\nprint("[", class_name, "] ", name, sep="")\nprint("工作：", role, sep="")', [t('值日生', '七年一班\n小安\n值日生', '[七年一班] 小安\n工作：值日生'), t('換工作與姓名', '八年二班\nAlex\n圖書股長', '[八年二班] Alex\n工作：圖書股長')], ['每一次 input() 讀一筆資料。', '方括號是文字，要放在引號裡。'], '七年一班\n小安\n值日生', 'class_name = input()\nname = input()\nrole = input()\n# 補上兩行輸出\nprint(name)')
  ],
  3: [
    upgrade(2, '進階：加權平均', '仍讀取兩個可含小數的分數。第一筆權重為 2，第二筆權重為 1，只輸出 (第一筆 × 2 + 第二筆) / 3。此題保證輸入為 0～100 的數字；範圍判斷將在第 4 課練習。', 'a = float(input())\nb = float(input())\nprint((a * 2 + b) / 3)', [t('權重不相同', '60\n90', 70, numeric), t('下限', '0\n0', 0, numeric), t('上限', '100\n100', 100, numeric), t('混合小數', '70.5\n81', 74, numeric)], ['第一筆先乘以 2，再加入第二筆。', '總權重是 3，不是資料筆數 2。'], '60\n90'),
    upgrade(3, '終極：把秒數拆成時分秒', '讀取整數秒數（題目保證 0～86400）。依序輸出小時、剩餘分鐘、剩餘秒數，各一行。例：3661 → 1、1、1。使用 // 和 %，小時不限制在 23。', 'seconds = int(input())\nhours = seconds // 3600\nminutes = (seconds % 3600) // 60\nremaining = seconds % 60\nprint(hours)\nprint(minutes)\nprint(remaining)', [t('零秒', '0', '0\n0\n0'), t('接近一分鐘', '59', '0\n0\n59'), t('剛好一分鐘', '60', '0\n1\n0'), t('一小時又一分一秒', '3661', '1\n1\n1'), t('上限一天', '86400', '24\n0\n0')], ['整除取得完整單位，餘數是尚未換算的部分。', '先用 % 3600 去掉完整小時，再算分鐘。'], '3661', 'seconds = int(input())\n# 算出三個單位，各輸出一行\nhours = 0\nminutes = 0\nremaining = 0\nprint(hours)\nprint(minutes)\nprint(remaining)')
  ],
  4: [
    upgrade(2, '進階：新門檻與有效範圍', '輪胎規則改為胎壓低於 35 或胎痕小於 2 就需要維護。有效範圍：胎壓 0～100，胎痕 0～20，皆含端點。超出任一範圍只輸出「輸入無效」；其他情況沿用兩種維護訊息。輸入保證為數字。', 'pressure = float(input())\ntread = float(input())\nif pressure < 0 or pressure > 100 or tread < 0 or tread > 20:\n    print("輸入無效")\nelif pressure < 35 or tread < 2:\n    print("需要維護")\nelse:\n    print("不需要維護")', [t('新胎壓門檻', '34.9\n2', '需要維護'), t('新胎痕門檻', '35\n1.99', '需要維護'), t('恰好兩個門檻', '35\n2', '不需要維護'), t('有效下限', '0\n0', '需要維護'), t('有效上限', '100\n20', '不需要維護'), t('負胎壓', '-0.1\n2', '輸入無效'), t('胎壓剛越上限', '100.1\n2', '輸入無效'), t('負胎痕', '35\n-0.1', '輸入無效'), t('胎痕剛越上限', '35\n20.1', '輸入無效')], ['先檢查資料是否有效，再判斷維護。', '用 if / elif / else 依序處理：無效、維護、正常。'], '35\n2'),
    upgrade(3, '終極：分級成績通知', '讀取整數分數：0～100 為有效範圍。90～100 輸出「優良」，60～89 輸出「及格」，0～59 輸出「再加油」；其他整數輸出「輸入無效」。', 'score = int(input())\nif score < 0 or score > 100:\n    print("輸入無效")\nelif score >= 90:\n    print("優良")\nelif score >= 60:\n    print("及格")\nelse:\n    print("再加油")', [t('下限', '0', '再加油'), t('及格前一分', '59', '再加油'), t('及格門檻', '60', '及格'), t('優良前一分', '89', '及格'), t('優良門檻', '90', '優良'), t('上限', '100', '優良'), t('低於下限', '-1', '輸入無效'), t('高於上限', '101', '輸入無效')], ['先排除無效分數。', '從高門檻往下判斷，避免 95 提早被判成及格。'], '90', 'score = int(input())\n# 先檢查範圍，再完成三個等級\nif score >= 60:\n    print("及格")\nelse:\n    print("再加油")')
  ],
  5: [
    upgrade(2, '進階：只累加偶數', '讀取整數 n：有效範圍為 1～10000。用 for 加總 1 到 n 的偶數，只輸出總和；範圍外輸出「輸入無效」。', 'n = int(input())\nif n < 1 or n > 10000:\n    print("輸入無效")\nelse:\n    total = 0\n    for i in range(1, n + 1):\n        if i % 2 == 0:\n            total += i\n    print(total)', [t('上限是奇數', '5', 6, forLoop), t('最小有效值', '1', 0), t('第二個有效值', '2', 2), t('最大有效值', '10000', 25005000), t('剛低於下限', '0', '輸入無效'), t('負數', '-1', '輸入無效'), t('剛高於上限', '10001', '輸入無效')], ['先檢查 n，再進入 for。', '只有 i % 2 == 0 才執行累加。'], '5'),
    upgrade(3, '終極：區間中的三倍數', '讀取起點 start、終點 end，均為整數且在 0～10000。start 必須 ≤ end。用 for 加總此區間內 3 的倍數，包含兩個端點；不合法時只輸出「輸入無效」。', 'start = int(input())\nend = int(input())\nif start < 0 or end > 10000 or start > end:\n    print("輸入無效")\nelse:\n    total = 0\n    for i in range(start, end + 1):\n        if i % 3 == 0:\n            total += i\n    print(total)', [t('一般區間', '2\n10', 18, forLoop), t('同一個倍數', '3\n3', 3), t('沒有倍數', '1\n2', 0), t('全範圍', '0\n10000', 16668333), t('起點大於終點', '10\n2', '輸入無效'), t('起點低於範圍', '-1\n10', '輸入無效'), t('終點高於範圍', '0\n10001', '輸入無效')], ['range(start, end + 1) 才會包含終點。', '用 % 3 == 0 判斷三倍數；同起終點也要測試。'], '2\n10', 'start = int(input())\nend = int(input())\ntotal = 0\n# 補上範圍檢查、迴圈與倍數條件\nprint(total)')
  ],
  6: [
    upgrade(2, '進階：可調大小的乘法表', '讀取 rows、columns 兩個整數，各為 1～12。用巢狀 for 印出 1～rows 各乘以 1～columns 的算式，格式沿用初階；任一值超出範圍只輸出「輸入無效」。', 'rows = int(input())\ncolumns = int(input())\nif rows < 1 or rows > 12 or columns < 1 or columns > 12:\n    print("輸入無效")\nelse:\n    for i in range(1, rows + 1):\n        for j in range(1, columns + 1):\n            print(i, "*", j, "=", i * j)', [t('長方形範圍', '2\n3', table(2, 3), nestedLoop), t('最小範圍', '1\n1', table(1, 1)), t('最大範圍', '12\n12', table(12, 12)), t('列數為零', '0\n3', '輸入無效'), t('欄數高於上限', '3\n13', '輸入無效'), t('負欄數', '3\n-1', '輸入無效')], ['外圈終點取決於 rows；內圈終點取決於 columns。', '先檢查兩個輸入，再執行整張表。'], '2\n3'),
    upgrade(3, '終極：空心星號方框', '讀取整數 n，有效範圍 1～12。用巢狀 for 印出 n × n 的空心方框：邊界為 *，內部為半形空格；每列換行。n=1 只印一個 *，超出範圍輸出「輸入無效」。', 'n = int(input())\nif n < 1 or n > 12:\n    print("輸入無效")\nelse:\n    for row in range(n):\n        for column in range(n):\n            if row == 0 or row == n - 1 or column == 0 or column == n - 1:\n                print("*", end="")\n            else:\n                print(" ", end="")\n        print()', [t('四乘四空心框', '4', frame(4), nestedLoop), t('一格邊界', '1', '*'), t('兩格沒有內部', '2', frame(2)), t('最大範圍', '12', frame(12)), t('低於下限', '0', '輸入無效'), t('高於上限', '13', '輸入無效')], ['四種邊界只要一個成立就印星號。', '每個字元用 end=""，每列內圈結束後才 print() 換行。'], '4', 'n = int(input())\n# 完成有效範圍、邊界判斷和每列換行\nfor row in range(n):\n    for column in range(n):\n        pass')
  ],
  7: [
    upgrade(2, '進階：只收有效數值', '用 while 讀取整數，-1 表示停止。只收 0～10000（含端點），其他值略過。最後先輸出總和，再輸出有效筆數，各一行；停止值不列入。', 'total = 0\ncount = 0\nwhile True:\n    number = int(input())\n    if number == -1:\n        break\n    if 0 <= number <= 10000:\n        total += number\n        count += 1\nprint(total)\nprint(count)', [t('有效與無效混合', '3\n-2\n10001\n0\n7\n-1', '10\n3', whileLoop), t('立即停止', '-1', '0\n0'), t('有效上限', '10000\n-1', '10000\n1'), t('全部無效', '-2\n10001\n-1', '0\n0'), t('停止後不再讀', '5\n-1\n100', '5\n1')], ['先檢查 -1，再檢查有效範圍。', '有效的 0 也算一筆；只有接受資料時才增加 count。'], '3\n-2\n0\n7\n-1'),
    upgrade(3, '終極：串流統計工具', '沿用 -1 停止與 0～10000 的有效範圍。最後依序輸出總和、有效筆數、最大值，各一行；沒有有效資料時只輸出「沒有資料」。使用 while，不必先把資料存成清單。', 'total = 0\ncount = 0\nlargest = 0\nwhile True:\n    number = int(input())\n    if number == -1:\n        break\n    if 0 <= number <= 10000:\n        total += number\n        count += 1\n        if number > largest:\n            largest = number\nif count == 0:\n    print("沒有資料")\nelse:\n    print(total)\n    print(count)\n    print(largest)', [t('最大值不在最後', '8\n3\n-2\n5\n-1', '16\n3\n8', whileLoop), t('沒有資料', '-1', '沒有資料'), t('只有零', '0\n-1', '0\n1\n0'), t('最大有效值', '10000\n10000\n-1', '20000\n2\n10000'), t('只有無效資料', '-2\n10001\n-1', '沒有資料')], ['largest 在接受新資料時才更新。', '先判斷 count 是否為 0，再輸出統計結果。'], '8\n3\n5\n-1', 'total = 0\ncount = 0\nlargest = 0\nwhile True:\n    number = int(input())\n    if number == -1:\n        break\n    # 補上接受條件與三個統計值\n# 補上沒有資料與正常輸出')
  ],
  8: [
    upgrade(2, '進階：及格分數的平均', '第一行整數 n（0～100），後面 n 行各為整數分數（0～100）。任一輸入超出範圍，輸出「輸入無效」。只收 ≥60 的分數到清單；有及格資料時先輸出平均、再輸出筆數，各一行，否則輸出「沒有及格資料」。', 'n = int(input())\nif n < 0 or n > 100:\n    print("輸入無效")\nelse:\n    passed = []\n    valid = True\n    for i in range(n):\n        score = int(input())\n        if score < 0 or score > 100:\n            valid = False\n        elif score >= 60:\n            passed.append(score)\n    if not valid:\n        print("輸入無效")\n    elif len(passed) == 0:\n        print("沒有及格資料")\n    else:\n        total = 0\n        for score in passed:\n            total += score\n        print(total / len(passed))\n        print(len(passed))', [t('只算及格分數', '4\n59\n60\n100\n0', '80\n2', { numeric: true, requires: ['For', 'List'] }), t('沒有資料', '0', '沒有及格資料'), t('全不及格', '2\n0\n59', '沒有及格資料'), t('單筆門檻', '1\n60', '60\n1', numeric), t('最多筆數', '100\n' + Array(100).fill(100).join('\n'), '100\n100', numeric), t('負分數', '1\n-1', '輸入無效'), t('超過滿分', '1\n101', '輸入無效'), t('負筆數', '-1', '輸入無效'), t('筆數超標', '101', '輸入無效')], ['用清單收集及格分數，平均的除數是及格筆數。', '檢查 valid，再處理空清單，避免除以零。'], '4\n59\n60\n100\n0'),
    upgrade(3, '終極：保留順序、移除重複', '第一行 n（整數 0～100），後面 n 行各為整數 -1000～1000。超出範圍輸出「輸入無效」。用清單只保留每個數字第一次出現的位置，先輸出去重後清單，再輸出其總和。n=0 輸出 [] 與 0，各一行。', 'n = int(input())\nif n < 0 or n > 100:\n    print("輸入無效")\nelse:\n    unique = []\n    valid = True\n    for i in range(n):\n        value = int(input())\n        if value < -1000 or value > 1000:\n            valid = False\n        elif value not in unique:\n            unique.append(value)\n    if not valid:\n        print("輸入無效")\n    else:\n        total = 0\n        for value in unique:\n            total += value\n        print(unique)\n        print(total)', [t('保持首次出現順序', '5\n3\n1\n3\n2\n1', '[3, 1, 2]\n6', { requires: ['For', 'List'] }), t('空清單', '0', '[]\n0'), t('兩個數值端點', '3\n-1000\n1000\n-1000', '[-1000, 1000]\n0'), t('最多筆數全重複', '100\n' + Array(100).fill(7).join('\n'), '[7]\n7'), t('數值剛越界', '1\n1001', '輸入無效'), t('負筆數', '-1', '輸入無效'), t('筆數越界', '101', '輸入無效')], ['value not in unique 表示還沒收集這個數字。', '直接印出 unique 可保留順序；不要重新排序。'], '5\n3\n1\n3\n2\n1', 'n = int(input())\nunique = []\n# 檢查範圍，收集未出現過的數字\nfor i in range(n):\n    value = int(input())\n    pass\nprint(unique)\nprint(0)', ['membership'])
  ],
  9: [
    upgrade(2, '進階：安全的圓形工具', '修改 circle_area(radius) 與 circle_length(radius)：半徑必須為 0～1000000 的有限數字，否則函式回傳 None。主程式讀一個半徑；有效時依序輸出面積、周長，否則輸出「輸入無效」。也會直接呼叫函式檢查參數範圍。', 'import math\n\ndef circle_area(radius):\n    if 0 <= radius <= 1000000:\n        return math.pi * radius ** 2\n    return None\n\ndef circle_length(radius):\n    if 0 <= radius <= 1000000:\n        return 2 * math.pi * radius\n    return None\n\nradius = float(input())\narea = circle_area(radius)\nif area is None:\n    print("輸入無效")\nelse:\n    print(area)\n    print(circle_length(radius))', [t('一般半徑', '2', `${Math.PI * 4}\n${Math.PI * 4}`, { ...numeric, ...functions }), t('下限零', '0', '0\n0', numeric), t('最大半徑', '1000000', `${Math.PI * 1e12}\n${Math.PI * 2e6}`, numeric), t('負半徑', '-1', '輸入無效'), t('超過上限', '1000001', '輸入無效'), t('非有限數值', 'nan', '輸入無效'), t('函式也要拒絕負數', '-1', '輸入無效\nNone\nNone', { probe: 'print(circle_area(-1))\nprint(circle_length(-1))' }), t('函式也要拒絕極大值', '1000001', '輸入無效\nNone', { probe: 'print(circle_area(1000001))' })], ['有效範圍檢查要放在兩個函式裡。', '用 area is None 判斷是否有效，避免把有效的 0 誤判。'], '2', undefined, ['none']),
    upgrade(3, '終極：長方形工具組', '定義 rectangle_area(w,h)、rectangle_length(w,h)、rectangle_diagonal(w,h)。兩個邊長都須 >0 且 ≤1000000，否則各函式回傳 None。主程式讀兩個邊長，有效時輸出面積、周長、對角線各一行（對角線用 math.sqrt）；無效時只輸出「輸入無效」。', 'import math\n\ndef rectangle_area(w, h):\n    if 0 < w <= 1000000 and 0 < h <= 1000000:\n        return w * h\n    return None\n\ndef rectangle_length(w, h):\n    if 0 < w <= 1000000 and 0 < h <= 1000000:\n        return 2 * (w + h)\n    return None\n\ndef rectangle_diagonal(w, h):\n    if 0 < w <= 1000000 and 0 < h <= 1000000:\n        return math.sqrt(w ** 2 + h ** 2)\n    return None\n\nw = float(input())\nh = float(input())\narea = rectangle_area(w, h)\nif area is None:\n    print("輸入無效")\nelse:\n    print(area)\n    print(rectangle_length(w, h))\n    print(rectangle_diagonal(w, h))', [t('三四五長方形', '3\n4', '12\n14\n5', { ...numeric, ...functions }), t('小數邊長', '0.1\n0.2', `0.02\n0.6\n${Math.sqrt(.05)}`, numeric), t('最大邊長', '1000000\n1000000', `1000000000000\n4000000\n${Math.sqrt(2e12)}`, numeric), t('零寬度', '0\n4', '輸入無效'), t('負高度', '3\n-1', '輸入無效'), t('高度越界', '3\n1000001', '輸入無效'), t('無限數值', 'inf\n4', '輸入無效'), t('重用函式', '3\n4', '12\n14\n5\n20\n18\nNone', { ...numeric, probe: 'print(rectangle_area(4, 5))\nprint(rectangle_length(4, 5))\nprint(rectangle_diagonal(0, 5))' })], ['三個函式各自檢查兩個參數。', '對角線為 math.sqrt(w ** 2 + h ** 2)。None 是無效結果，不是字串。'], '3\n4', 'import math\n\ndef rectangle_area(w, h):\n    pass\n\ndef rectangle_length(w, h):\n    pass\n\ndef rectangle_diagonal(w, h):\n    pass\n\nw = float(input())\nh = float(input())\n# 呼叫三個函式，並處理無效資料', ['none'])
  ]
};

const checkoutBody = `prices = [120, 250, 380]\n\ndef cart_total(cart):\n    total = 0\n    for value in cart:\n        total += value\n    return total\n\nbalance = int(input())\ncart = []\nvalid = 0 <= balance <= 1000000\nif valid:\n    while True:\n        code = int(input())\n        if code == -1:\n            break\n        if code < 1 or code > 3 or len(cart) >= 50:\n            valid = False\n            break\n        quantity = int(input())\n        if quantity < 1 or quantity > 10:\n            valid = False\n            break\n        cart.append(prices[code - 1] * quantity)\n`;
const checkoutOutput = '    if balance >= total:\n        print("結帳成功，餘額剩", balance - total, "元", sep="")\n    else:\n        print("餘額不足，請另外加值", total - balance, "元", sep="")';
const checkout = checkoutBody + 'if not valid:\n    print("輸入無效")\nelse:\n    total = cart_total(cart)\n' + checkoutOutput;
const discounted = `def discount_total(total):\n    if total >= 1000:\n        return total * 9 // 10\n    return total\n\ntry:\n` + (checkoutBody + 'if not valid:\n    print("輸入無效")\nelse:\n    original = cart_total(cart)\n    total = discount_total(original)\n    print("原價", original, "元", sep="")\n    print("折扣後", total, "元", sep="")\n' + checkoutOutput).split('\n').filter(Boolean).map(line => '    ' + line).join('\n') + '\nexcept (ValueError, EOFError):\n    print("輸入無效")';
const cartInput = (balance, items) => [balance, ...items.flat(), -1].join('\n');
const cartExpected = (balance, items, discount = false) => {
  const original = items.reduce((sum, [code, quantity]) => sum + [120, 250, 380][code - 1] * quantity, 0);
  const total = discount && original >= 1000 ? Math.floor(original * 9 / 10) : original;
  return (discount ? `原價${original}元\n折扣後${total}元\n` : '') + (balance >= total ? `結帳成功，餘額剩${balance - total}元` : `餘額不足，請另外加值${total - balance}元`);
};
const cartRules = '商品價格改為 120、250、380 元。第一行整數餘額（0～1000000）；之後每筆兩行：商品編號（1～3）、數量（1～10），編號 -1 結束，不需數量。最多 50 筆商品。範圍錯誤只輸出「輸入無效」。保留 cart_total(cart) 的分工。';
advanced[10] = [
  upgrade(2, '進階：數量與輸入範圍', cartRules + '有效時沿用初階的兩種結帳訊息。此題保證輸入為整數且行數完整。', checkout, [t('換價格並計算數量', cartInput(2000, [[1, 2], [3, 3]]), cartExpected(2000, [[1, 2], [3, 3]]), { ...whileLoop, ...functions }), t('餘額恰好', cartInput(250, [[2, 1]]), cartExpected(250, [[2, 1]])), t('零餘額空購物車', '0\n-1', '結帳成功，餘額剩0元'), t('最大餘額與筆數', cartInput(1000000, Array(50).fill([3, 10])), '結帳成功，餘額剩810000元'), ...[['負餘額', '-1'], ['餘額越界', '1000001'], ['商品零', '500\n0'], ['商品越界', '500\n4'], ['數量零', '500\n1\n0'], ['數量越界', '500\n1\n11'], ['筆數越界', cartInput(1000000, Array(51).fill([1, 1]))]].map(([name, input]) => t(name, input, '輸入無效'))], ['每件商品要先驗證編號，再讀數量，最後加入價格 × 數量。', '先排除編號 0，避免 Python 負索引誤選最後一項。'], '2000\n1\n2\n3\n3\n-1'),
  upgrade(3, '終極：折扣與異常輸入', cartRules + '新增 discount_total(total)：原價 ≥1000 打九折，折扣後金額無條件捨去至整數元，否則原價結帳。先輸出「原價X元」「折扣後Y元」，再輸出結帳訊息。非整數、空白或缺少輸入也只輸出「輸入無效」（用 try / except）。', discounted, [t('折扣門檻以下', cartInput(1000, [[1, 2], [2, 3]]), cartExpected(1000, [[1, 2], [2, 3]], true), { ...whileLoop, ...functions }), t('恰好折扣門檻', cartInput(900, [[2, 4]]), cartExpected(900, [[2, 4]], true)), t('折扣後仍不足', cartInput(500, [[3, 3]]), cartExpected(500, [[3, 3]], true)), t('最高範圍', cartInput(1000000, Array(50).fill([3, 10])), cartExpected(1000000, Array(50).fill([3, 10]), true)), t('空購物車', '0\n-1', cartExpected(0, [], true)), ...[['非整數餘額', 'abc'], ['非整數商品', '500\nhello'], ['小數數量', '500\n1\n1.5'], ['缺少數量', '500\n1'], ['空白餘額', '\n-1'], ['缺少停止值', '500\n1\n2'], ['商品零', '500\n0'], ['商品越界', '500\n4'], ['負數量', '500\n1\n-2'], ['負餘額', '-2']].map(([name, input]) => t(name, input, '輸入無效')), t('重用折扣函式', '0\n-1', cartExpected(0, [], true) + '\n999\n900\n900', { probe: 'print(discount_total(999))\nprint(discount_total(1000))\nprint(discount_total(1001))' })], ['輸入與計算放在 try；except (ValueError, EOFError) 處理轉換失敗或資料不足。', '先由 discount_total 回傳金額，再判斷餘額；九折使用 total * 9 // 10。'], '1000\n2\n4\n-1', 'prices = [120, 250, 380]\n\ndef cart_total(cart):\n    total = 0\n    for value in cart:\n        total += value\n    return total\n\ndef discount_total(total):\n    return total  # 完成門檻與九折\n\n# 用 try / except 組合讀取、範圍檢查與三行結果\nbalance = int(input())\ncart = []', ['exceptions'])
];

// 分別檢查各輸入的上下限，避免只檢查其中一個參數也取得星級。
advanced[6][0].tests.push(t('列數高於上限', '13\n3', '輸入無效'), t('欄數為零', '3\n0', '輸入無效'));
advanced[8][1].tests.push(t('數值剛低於下限', '1\n-1001', '輸入無效'));
advanced[9][0].tests.push(t('兩個函式各自檢查上限', '0', '0\n0\nNone\nNone', { numeric: true, probe: 'print(circle_area(1000001))\nprint(circle_length(1000001))' }));
advanced[9][1].tests.push(t('寬度越界', '1000001\n3', '輸入無效'), t('高度為零', '3\n0', '輸入無效'), t('三個函式各自檢查兩邊', '3\n4', '12\n14\n5\nNone\nNone\nNone\nNone\nNone\nNone', { numeric: true, probe: 'print(rectangle_area(0, 4))\nprint(rectangle_length(0, 4))\nprint(rectangle_diagonal(0, 4))\nprint(rectangle_area(4, 1000001))\nprint(rectangle_length(4, 1000001))\nprint(rectangle_diagonal(4, 1000001))' }));
advanced[10][1].tests.push(...[['餘額越界', '1000001'], ['數量零', '500\n1\n0'], ['數量越界', '500\n1\n11'], ['筆數越界', cartInput(1000000, Array(51).fill([1, 1]))]].map(([name, input]) => t(name, input, '輸入無效')));

export function extraActivities(lesson) {
  return advanced[lesson.id].map(item => ({ ...item, starter: item.starter || lesson.activities[2].solution + '\n\n# 請依新任務修改上方程式；原解答不符合新的規則。' }));
}

// 每次二、三星驗證，追加新產生的有效輸入；固定案例負責明訂邊界與無效資料。
export function verificationTests(lesson, activity, random = Math.random) {
  const tests = activity.tests.slice();
  if (!activity.tier || activity.tier < 2 || lesson.id === 1) return tests;
  const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
  for (let trial = 0; trial < 6; trial++) {
    const name = `新情境 ${trial + 1}`;
    const tier = activity.tier;
    let extra;
    switch (lesson.id) {
      case 2: {
        const group = `第${integer(1, 9)}班`, nameValue = `同學${integer(1, 999)}`, role = `任務${integer(1, 9)}`;
        extra = t(name, tier === 2 ? `${group}\n${nameValue}` : `${group}\n${nameValue}\n${role}`, tier === 2 ? `姓名：${nameValue}\n班級：${group}` : `[${group}] ${nameValue}\n工作：${role}`); break;
      }
      case 3: {
        const a = integer(0, 1000) / 10, b = integer(0, 1000) / 10, seconds = integer(0, 86400);
        extra = tier === 2 ? t(name, `${a}\n${b}`, (a * 2 + b) / 3, numeric) : t(name, seconds, `${Math.floor(seconds / 3600)}\n${Math.floor((seconds % 3600) / 60)}\n${seconds % 60}`); break;
      }
      case 4: {
        const pressure = integer(-1, 101), tread = integer(-1, 201) / 10, score = integer(-1, 101);
        extra = tier === 2 ? t(name, `${pressure}\n${tread}`, pressure < 0 || pressure > 100 || tread < 0 || tread > 20 ? '輸入無效' : pressure < 35 || tread < 2 ? '需要維護' : '不需要維護') : t(name, score, score < 0 || score > 100 ? '輸入無效' : score >= 90 ? '優良' : score >= 60 ? '及格' : '再加油'); break;
      }
      case 5: {
        const a = integer(0, 10000), b = integer(a, 10000), n = integer(1, 10000);
        extra = tier === 2 ? t(name, n, evenSum(n), forLoop) : t(name, `${a}\n${b}`, multiplesSum(a, b), forLoop); break;
      }
      case 6: { const a = integer(1, 12), b = integer(1, 12); extra = tier === 2 ? t(name, `${a}\n${b}`, table(a, b), nestedLoop) : t(name, a, frame(a), nestedLoop); break; }
      case 7: {
        const values = Array.from({ length: integer(0, 8) }, () => integer(-3, 10002)).filter(value => value !== -1);
        const accepted = values.filter(value => value >= 0 && value <= 10000), sum = accepted.reduce((a, b) => a + b, 0);
        extra = t(name, [...values, -1].join('\n'), tier === 2 ? `${sum}\n${accepted.length}` : accepted.length ? `${sum}\n${accepted.length}\n${Math.max(...accepted)}` : '沒有資料', whileLoop); break;
      }
      case 8: {
        const values = Array.from({ length: integer(0, 12) }, () => tier === 2 ? integer(0, 100) : integer(-5, 5));
        const accepted = tier === 2 ? values.filter(value => value >= 60) : [...new Set(values)];
        const sum = accepted.reduce((a, b) => a + b, 0);
        extra = t(name, [values.length, ...values].join('\n'), tier === 2 ? accepted.length ? `${sum / accepted.length}\n${accepted.length}` : '沒有及格資料' : `[${accepted.join(', ')}]\n${sum}`, tier === 2 && accepted.length ? numeric : {}); break;
      }
      case 9: {
        const a = integer(1, 10000) / 10, b = integer(1, 10000) / 10;
        extra = tier === 2 ? t(name, a, `${Math.PI * a * a}\n${2 * Math.PI * a}`, numeric) : t(name, `${a}\n${b}`, `${a * b}\n${2 * (a + b)}\n${Math.sqrt(a * a + b * b)}`, numeric); break;
      }
      case 10: {
        const items = Array.from({ length: integer(0, 6) }, () => [integer(1, 3), integer(1, 10)]), balance = integer(0, 20000);
        extra = t(name, cartInput(balance, items), cartExpected(balance, items, tier === 3), { ...whileLoop, ...functions }); break;
      }
      case 11: {
        const values = Array.from({ length: integer(0, 12) }, () => tier === 2 ? integer(0, 100) : integer(-1000, 1000));
        const result = values.slice().sort((a, b) => tier === 2 ? b - a : a - b);
        extra = t(name, [values.length, ...values].join('\n'), `[${(tier === 2 ? result.slice(0, 3) : result).join(', ')}]`); break;
      }
      case 12: {
        const fruits = ['蘋果', '香蕉', '葡萄', '橘子'];
        const votes = Array.from({ length: integer(0, 12) }, () => {
          const vote = [...fruits, '西瓜'][integer(0, 4)];
          return tier === 3 && integer(0, 1) ? ` ${vote} ` : vote;
        });
        const counts = fruits.map(fruit => votes.filter(vote => (tier === 3 ? vote.trim() : vote) === fruit).length);
        const invalid = votes.length - counts.reduce((a, b) => a + b, 0);
        let expected = fruits.map((fruit, i) => `${fruit}：${counts[i]}`).join('\n') + `\n無效票：${invalid}`;
        if (tier === 3) {
          const largest = Math.max(...counts), winners = fruits.filter((fruit, i) => counts[i] === largest);
          expected += largest === 0 ? '\n沒有有效票' : `\n最高票：${largest}\n${winners.length === 1 ? '當選' : '並列'}：${winners.join('、')}`;
        }
        extra = t(name, [votes.length, ...votes].join('\n'), expected); break;
      }
    }
    tests.push(extra);
  }
  return tests;
}
