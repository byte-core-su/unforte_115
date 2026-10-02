// 教材由 data/class-01.txt～class-10.txt 重整；原始資料保留供教師查閱。
const activity = (title, task, starter, solution, tests, hints, input = '', expected = '') => ({ title, task, starter, solution, tests, hints, input, expected });
const test = (name, input, expected, extra = {}) => ({ name, input, expected, ...extra });
export const lessons = [
  {
    id: 1, title: '從積木到文字', subtitle: '讓 Python 說出第一句話', level: '修改範例', source: [1], syntax: ['print', 'comments'],
    goal: '用 print() 輸出文字，理解引號、註解與循序執行。',
    bridge: 'Scratch 的「說出」積木 → Python 的 print()。程式從上往下執行，就像依序接起積木。',
    concepts: [['文字要用引號包起來', '使用半形單引號或雙引號，前後配成一對。中文內容可以放在引號裡。'], ['一行一個動作', '連續呼叫兩次 print()，就會依序輸出兩行。'], ['註解幫助閱讀', '# 後面的文字是說明，Python 不會執行它。']],
    exit: '如果交換兩行 print()，輸出會怎麼變？註解會出現在輸出中嗎？',
    activities: [
      activity('觀察：第一句話', '先預測會出現幾行，再執行。試著交換兩行的順序。', '# 這是說明，不會被印出\nprint("Hello World!")\nprint("歡迎來到 Python Lab")', 'print("Hello World!")\nprint("歡迎來到 Python Lab")', [], ['每個 print() 預設會在最後換行。'], '', 'Hello World!\n歡迎來到 Python Lab'),
      activity('引導：修改歡迎訊息', '修改兩個引號中的內容，第一行輸出「你好，Python！」，第二行輸出「我會修改程式了」。', 'print("Hello World!")\nprint("請修改這句話")', 'print("你好，Python！")\nprint("我會修改程式了")', [test('兩行歡迎訊息', '', '你好，Python！\n我會修改程式了')], ['保留 print、括號與引號，先只修改引號內的文字。', '每個 print() 負責一行；注意全形驚嘆號「！」。']),
      activity('挑戰：三行學習宣言', '沿用第一行，在下方新增兩行，依序輸出「我會觀察」「我會修改」「我會驗證」。', '# 補上第二、三行\nprint("我會觀察")', 'print("我會觀察")\nprint("我會修改")\nprint("我會驗證")', [test('三行依序執行', '', '我會觀察\n我會修改\n我會驗證')], ['複製現有的 print()，再修改文字。', '輸出順序和程式行的順序相同。'])
    ]
  },
  {
    id: 2, title: '讓程式記住回答', subtitle: '變數與使用者輸入', level: '修改與補寫', source: [1, 2], syntax: ['variables', 'input', 'print'],
    goal: '用變數保存 input() 的回答，並將回答組合成訊息。', bridge: 'Scratch「詢問並等待」的答案 → input()；「將變數設為」→ =。',
    concepts: [['變數是資料的名字', 'name = "小安" 把文字指定給 name。等號是指定值，不是數學上的相等比較。'], ['input() 每次讀一行', '先在右側輸入資料。程式每執行一次 input()，就讀取下一行。'], ['print() 可放多個值', 'print("你好", name) 預設以空格分隔；sep="" 可取消空格。']],
    exit: 'name 與 "name" 有什麼不同？第二次 input() 會讀到哪一行？',
    activities: [
      activity('觀察：姓名問答', '輸入你的暱稱，先猜結果。修改輸入，再執行一次。', 'name = input()\nprint("哈囉", name)', 'name = input()\nprint("哈囉", name)', [], ['name 是變數；"哈囉" 是文字。'], '小安', '哈囉 小安'),
      activity('引導：值日生公告', '把固定姓名改為 input()，輸出「今天值日生：小安」。姓名應隨輸入改變，冒號後不留空格。', '# 把固定姓名改為讀取輸入\nname = "小安"\nprint("今天值日生：", name, sep="")', 'name = input()\nprint("今天值日生：", name, sep="")', [test('姓名小安', '小安', '今天值日生：小安'), test('換一個姓名', '小雨', '今天值日生：小雨')], ['input() 讀回的資料可直接存進 name。', '把第一行改為 name = input()。'], '小安'),
      activity('挑戰：班級名牌', '第一行讀班級，第二行讀姓名，輸出「七年一班 / 小安」。班級、姓名都要跟著輸入改變。', 'class_name = input()\n# 補上讀取姓名與輸出\nname = "小安"\nprint(class_name)', 'class_name = input()\nname = input()\nprint(class_name, "/", name)', [test('第一張名牌', '七年一班\n小安', '七年一班 / 小安'), test('第二張名牌', '八年二班\n小雨', '八年二班 / 小雨')], ['再呼叫一次 input()，讀第二行。', 'print(class_name, "/", name) 會在各項之間加入空格。'], '七年一班\n小安')
    ]
  },
  {
    id: 3, title: '文字還是數字？', subtitle: '型態轉換與數值運算', level: '補寫運算', source: [2, 3], syntax: ['types', 'operators', 'input'],
    goal: '分辨字串和數字，選擇 int() 或 float() 進行運算。', bridge: 'Scratch 常自動解讀數字文字；Python 要先確認型態。input() 一律回傳字串。',
    concepts: [['同一個 +，不同效果', '"80" + "80" 是 "8080"；80 + 80 是 160。'], ['轉成數字再計算', 'int() 用於整數；float() 可讀取帶小數的數值。'], ['用 type() 觀察', 'str 是字串、int 是整數、float 是浮點數、bool 是真假值。']],
    exit: '為何輸入 80 後，直接相加會得到 8080？如果要輸入 3.5，應使用哪個轉換？',
    activities: [
      activity('觀察：80 加 80', '先預測前後兩個結果。改成其他整數，再比較。', 'score = input()\nprint(score + score)\nnumber = int(score)\nprint(number + number)\nprint(type(number))', 'score = input()\nprint(score + score)\nnumber = int(score)\nprint(number + number)\nprint(type(number))', [], ['第一個 score 是字串，number 才是整數。'], '80', "8080\n160\n<class 'int'>"),
      activity('引導：三個整數的和', '補上型態轉換與加總。每個整數各放一行，只輸出總和。', 'a = int(input())\nb = input()  # 這裡需要轉型\nc = input()  # 這裡需要轉型\nprint(a)  # 改成三數之和', 'a = int(input())\nb = int(input())\nc = int(input())\nprint(a + b + c)', [test('正整數', '3\n5\n7', '15'), test('包含負數與零', '-2\n0\n9', '7')], ['讓 b、c 也成為整數。', '使用 int(input())，最後 print(a + b + c)。'], '3\n5\n7'),
      activity('挑戰：平均分數', '讀取兩個可含小數的分數，只輸出平均值。', 'a = float(input())\nb = float(input())\n# 平均 = 兩數之和 / 2\nprint(a)', 'a = float(input())\nb = float(input())\nprint((a + b) / 2)', [test('兩個整數分數', '80\n90', '85', { numeric: true }), test('小數分數', '70.5\n80', '75.25', { numeric: true })], ['先把兩數相加，再除以 2。', '用括號把加法包起來，避免只有 b 被除以 2。'], '80\n90')
    ]
  },
  {
    id: 4, title: '程式做選擇', subtitle: '條件判斷與縮排', level: '補寫條件', source: [4], syntax: ['if', 'comparisons', 'logic'],
    goal: '寫出條件與分支，使用邊界數值驗證規則。', bridge: 'Scratch「如果…否則」→ if / else。Python 用縮排表示一個分支裡有哪些動作。',
    concepts: [['冒號與四個空格', 'if、elif、else 的開頭行以冒號結尾，內部動作縮排四個空格。'], ['比較得到 True 或 False', '== 比較是否相等；<、>、<=、>= 比較大小。'], ['or 與 and', 'or 只要一個條件成立；and 要兩個條件都成立。']], exit: '胎壓恰好 30、胎痕恰好 1.6 時，依題目需要維護嗎？為什麼？',
    activities: [
      activity('觀察：及格判斷', '分別輸入 59、60、80，觀察哪個分支執行。', 'score = int(input())\nif score >= 60:\n    print("及格")\nelse:\n    print("再加油")', 'score = int(input())\nif score >= 60:\n    print("及格")\nelse:\n    print("再加油")', [], ['>= 包含等於；60 會走第一個分支。'], '60', '及格'),
      activity('引導：奇偶判斷', '修改條件：整數除以 2 的餘數為 0 時輸出「偶數」，否則輸出「奇數」。', 'number = int(input())\nif True:  # 改成餘數判斷\n    print("偶數")\nelse:\n    print("奇數")', 'number = int(input())\nif number % 2 == 0:\n    print("偶數")\nelse:\n    print("奇數")', [test('偶數', '8', '偶數'), test('奇數', '7', '奇數'), test('零', '0', '偶數')], ['% 計算餘數，== 比較兩側的值。', '條件可寫 number % 2 == 0。'], '8'),
      activity('挑戰：輪胎檢驗', '第一行胎壓，第二行胎痕。胎壓低於 30 或胎痕小於 1.6，輸出「需要維護」，否則輸出「不需要維護」。', 'pressure = float(input())\ntread = float(input())\n# 補上條件與分支，注意縮排\nprint("請完成判斷")', 'pressure = float(input())\ntread = float(input())\nif pressure < 30 or tread < 1.6:\n    print("需要維護")\nelse:\n    print("不需要維護")', [test('正常', '40\n1.8', '不需要維護'), test('胎壓低', '25\n1.7', '需要維護'), test('胎痕淺', '40\n1.5', '需要維護'), test('恰好在門檻', '30\n1.6', '不需要維護')], ['有一個項目不合格就要維護，應使用 or。', '條件是 pressure < 30 or tread < 1.6；這裡不包含等於。'], '40\n1.8')
    ]
  },
  {
    id: 5, title: '固定次數的重複', subtitle: 'for、range 與累加器', level: '補寫迴圈', source: [5], syntax: ['for', 'range', 'accumulator'],
    goal: '用 for 重複執行，追蹤累加器，理解 range() 不包含終點。', bridge: 'Scratch「重複 N 次」→ for；迴圈變數 i 會依序取得範圍中的數字。',
    concepts: [['range 的終點不包含', 'range(1, 6) 產生 1、2、3、4、5。'], ['先初始化，再累加', 'total = 0 放在迴圈外，total += i 放在迴圈內。'], ['觀察中間結果', '把 print(i, total) 放在迴圈裡，就能看到每輪變化。']], exit: 'total = 0 如果移進迴圈會發生什麼？要包含 100，range 的終點是多少？',
    activities: [
      activity('觀察：累計過程', '先算前三輪的 total，再執行比較。', 'total = 0\nfor i in range(1, 6):\n    total += i\n    print(i, total)', 'total = 0\nfor i in range(1, 6):\n    total += i\n    print(i, total)', [], ['前三輪的累計值是 1、3、6。'], '', '1 1\n2 3\n3 6\n4 10\n5 15'),
      activity('引導：1 到 100 的和', '調整 range()，用 for 累加 1 到 100。最後只輸出總和。', 'total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)', 'total = 0\nfor i in range(1, 101):\n    total += i\nprint(total)', [test('累加 100 個數', '', '5050', { requires: ['For'] })], ['要包含 100，終點必須設成 101。', 'print(total) 保持在迴圈外，只輸出最後結果。']),
      activity('挑戰：使用者決定上限', '讀取正整數 n，用 for 累加 1 到 n，只輸出總和。', 'n = int(input())\ntotal = 0\n# 補上 for 迴圈\nprint(total)', 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)', [test('上限 5', '5', '15', { requires: ['For'] }), test('上限 1', '1', '1'), test('上限 10', '10', '55')], ['終點要比 n 多 1。', 'range(1, n + 1) 會包含 n。'], '5')
    ]
  },
  {
    id: 6, title: '迴圈裡還有迴圈', subtitle: '乘法表與逐輪除錯', level: '組合迴圈', source: [5, 6], syntax: ['for', 'range', 'print', 'pass'],
    goal: '理解外圈與內圈的分工，處理縮排與範圍邊界。', bridge: 'Scratch 把一個重複積木放進另一個重複積木；內圈完成後，外圈才前進一次。',
    concepts: [['外圈決定一組', '外圈的 i 固定時，內圈 j 跑完整個範圍。'], ['縮排表達層次', '外圈內容縮排四格，內圈內容再多四格。'], ['先做小範圍', '先測試 2 × 3 筆，比一次看 81 筆更容易找出錯誤。']], exit: 'i = 2 時，j 會取得哪些值？兩層迴圈各重複 9 次，一共印幾行？',
    activities: [
      activity('觀察：兩組乘法', '先預測 i = 2 開始前，會出現幾行。觀察 i、j 的順序。', 'for i in range(1, 3):\n    for j in range(1, 4):\n        print(i, j, i * j)', 'for i in range(1, 3):\n    for j in range(1, 4):\n        print(i, j, i * j)', [], ['外圈 2 次，內圈每次 3 次，共 6 行。'], '', '1 1 1\n1 2 2\n1 3 3\n2 1 2\n2 2 4\n2 3 6'),
      activity('引導：一個數的乘法表', '讀取 n，依序輸出 n 乘以 1～9 的算式，格式為「5 * 1 = 5」。', 'n = int(input())\nfor j in range(1, 4):  # 修改範圍\n    print(n, "*", j, "=", 0)  # 修改乘積', 'n = int(input())\nfor j in range(1, 10):\n    print(n, "*", j, "=", n * j)', [test('5 的乘法表', '5', Array.from({length: 9}, (_, i) => `5 * ${i + 1} = ${5 * (i + 1)}`).join('\n'), { requires: ['For'] }), test('2 的乘法表', '2', Array.from({length: 9}, (_, i) => `2 * ${i + 1} = ${2 * (i + 1)}`).join('\n'))], ['range(1, 10) 會走訪 1～9。', '最後一個參數應是 n * j。'], '5'),
      activity('挑戰：九九乘法表', '補上內圈，依序輸出 1～9 各乘以 1～9 的算式，共 81 行。', 'for i in range(1, 10):\n    # 內圈 j 從 1 到 9\n    pass', 'for i in range(1, 10):\n    for j in range(1, 10):\n        print(i, "*", j, "=", i * j)', [test('81 個算式與順序', '', Array.from({length: 9}, (_, i) => Array.from({length: 9}, (_, j) => `${i + 1} * ${j + 1} = ${(i + 1) * (j + 1)}`).join('\n')).join('\n'), { requires: ['For'], nestedFor: true })], ['內圈 for 要縮排四格，print 要縮排八格。', '內圈為 for j in range(1, 10):，算式沿用引導練習。'])
    ]
  },
  {
    id: 7, title: '何時停止重複？', subtitle: 'while、break 與停止值', level: '控制迴圈', source: [7], syntax: ['while', 'break', 'accumulator'],
    goal: '依條件重複執行，以停止值結束輸入，避免無限迴圈。', bridge: 'Scratch「重複直到」在條件成立時停止；Python while 在條件成立時繼續。',
    concepts: [['每輪都要讓狀態改變', '若 count 不增加，條件可能永遠成立。'], ['break 立刻離開迴圈', '先判斷 -1，再計算，避免把停止值當成資料。'], ['continue 跳過本輪剩下動作', '若使用 continue，別跳過必要的變數更新，否則可能無法停止。']], exit: '為何判斷 -1 必須放在平方計算之前？如果忘記更新 count，該如何停止？',
    activities: [
      activity('觀察：條件與更新', '先預測 count 的變化。試著修改結束值；若程式不停，可按停止。', 'count = 1\nwhile count <= 5:\n    print(count)\n    count += 1', 'count = 1\nwhile count <= 5:\n    print(count)\n    count += 1', [], ['最後一輪印出 5，再更新為 6，下一次條件不成立。'], '', '1\n2\n3\n4\n5'),
      activity('引導：平方查詢', '每次讀一個整數，輸出平方。讀到 -1 立刻結束，不輸出 -1 的平方。', 'while True:\n    number = int(input())\n    # 補上 -1 的停止判斷\n    print(number * number)', 'while True:\n    number = int(input())\n    if number == -1:\n        break\n    print(number * number)', [test('多次輸入', '10\n22\n-1', '100\n484', { requires: ['While', 'Break'] }), test('第一次就結束', '-1', ''), test('包含零', '0\n3\n-1', '0\n9')], ['在 print() 前用 if 判斷 number。', 'if number == -1: 的內部放 break。'], '10\n22\n-1'),
      activity('挑戰：累加到停止值', '用 while 讀取整數，直到 -1。最後只輸出總和，停止值不計入。', 'total = 0\nwhile True:\n    number = int(input())\n    if number == -1:\n        break\n    # 補上累加\nprint(total)', 'total = 0\nwhile True:\n    number = int(input())\n    if number == -1:\n        break\n    total += number\nprint(total)', [test('三筆資料', '3\n5\n7\n-1', '15', { requires: ['While'] }), test('沒有資料', '-1', '0'), test('包含負數', '-2\n8\n-1', '6')], ['沿用第 5 單元的累加器。', 'total += number 放在 break 判斷之後、迴圈內。'], '3\n5\n7\n-1')
    ]
  },
  {
    id: 8, title: '一次處理多筆資料', subtitle: '清單、索引與平均', level: '處理資料', source: [8, 5], syntax: ['list', 'len', 'for'],
    goal: '存取與走訪清單，用多筆、單筆、空清單驗證資料處理。', bridge: 'Scratch 清單的第一項索引為 1；Python list 的第一項索引為 0。',
    concepts: [['方括號建立清單', 'scores = [80, 90]；scores[0] 讀第一項。'], ['資料可以變動', 'append() 在尾端新增；del scores[0] 刪除第一項。'], ['先檢查資料筆數', 'len(scores) 是長度；空清單不能直接除以 0 算平均。']], exit: '刪除第一項之後，其他索引會怎麼變？空清單為何不能直接算平均？',
    activities: [
      activity('觀察：清單每一步', '預測新增與刪除後的清單。把索引改成 1 再觀察。', 'scores = [80, 90, 70]\nprint(scores[0])\nscores.append(100)\nprint(scores)\ndel scores[0]\nprint(scores)\nprint(len(scores))', 'scores = [80, 90, 70]\nprint(scores[0])\nscores.append(100)\nprint(scores)\ndel scores[0]\nprint(scores)\nprint(len(scores))', [], ['append 新增在最後；刪除第一項後，90 變成索引 0。'], '', '80\n[80, 90, 70, 100]\n[90, 70, 100]\n3'),
      activity('引導：收集並加總', '第一行為資料筆數 n，接著每行一個整數。用 append 收集，再用 for 加總，只輸出總和。', 'n = int(input())\nscores = []\nfor i in range(n):\n    score = int(input())\n    # 新增 score 到清單\ntotal = 0\nfor score in scores:\n    # 累加 score\n    pass\nprint(total)', 'n = int(input())\nscores = []\nfor i in range(n):\n    score = int(input())\n    scores.append(score)\ntotal = 0\nfor score in scores:\n    total += score\nprint(total)', [test('三筆分數', '3\n80\n90\n70', '240', { requires: ['For'] }), test('單筆', '1\n65', '65'), test('空清單', '0', '0')], ['scores.append(score) 放在第一個迴圈裡。', '第二個迴圈使用 total += score。'], '3\n80\n90\n70'),
      activity('挑戰：平均與空清單', '收集 n 筆分數，有資料時只輸出平均；n = 0 時輸出「沒有資料」。', 'n = int(input())\nscores = []\nfor i in range(n):\n    scores.append(int(input()))\ntotal = 0\nfor score in scores:\n    total += score\n# 補上空清單判斷與平均\nprint(total)', 'n = int(input())\nscores = []\nfor i in range(n):\n    scores.append(int(input()))\ntotal = 0\nfor score in scores:\n    total += score\nif len(scores) == 0:\n    print("沒有資料")\nelse:\n    print(total / len(scores))', [test('多筆平均', '3\n80\n90\n70', '80', { numeric: true }), test('單筆平均', '1\n65', '65', { numeric: true }), test('沒有資料', '0', '沒有資料')], ['先判斷 len(scores) == 0，再決定要不要除。', '有資料時平均為 total / len(scores)。'], '3\n80\n90\n70')
    ]
  },
  {
    id: 9, title: '把程式整理成工具', subtitle: '函式、參數與模組', level: '完成函式', source: [9], syntax: ['def', 'import', 'return'],
    goal: '定義可重用函式，區分參數、return 與 print，使用 math 模組。', bridge: 'Scratch 自訂積木的輸入 → 函式參數。Python 的 return 可以把計算結果交回呼叫處。',
    concepts: [['先定義，再呼叫', 'def 建立函式，呼叫時才執行裡面的內容。'], ['return 和 print 不同', 'return 把結果交回去；print 只是顯示訊息。'], ['import 使用既有工具', 'import math 載入數學模組，math.pi 是圓周率。']], exit: '把函式中的 return 改成 print，呼叫者拿到的結果有何不同？',
    activities: [
      activity('觀察：重用同一個函式', '改變兩次呼叫的參數。觀察函式只定義一次，卻可使用多次。', 'def add(a, b):\n    return a + b\n\nprint(add(3, 5))\nprint(add(10, 2))', 'def add(a, b):\n    return a + b\n\nprint(add(3, 5))\nprint(add(10, 2))', [], ['a、b 每次呼叫會得到不同的值。'], '', '8\n12'),
      activity('引導：圓面積函式', '補完 circle_area(radius)，回傳 π × 半徑平方。讀取半徑後只輸出面積。', 'import math\n\ndef circle_area(radius):\n    return 0  # 改成圓面積公式\n\nradius = float(input())\nprint(circle_area(radius))', 'import math\n\ndef circle_area(radius):\n    return math.pi * radius ** 2\n\nradius = float(input())\nprint(circle_area(radius))', [test('半徑 5', '5', String(Math.PI * 25), { numeric: true, requires: ['FunctionDef'] }), test('半徑 1', '1', String(Math.PI), { numeric: true }), test('直接呼叫函式', '0', `0\n${Math.PI * 4}`, { numeric: true, probe: 'print(circle_area(2))' })], ['** 2 表示平方，math.pi 表示 π。', 'return math.pi * radius ** 2。'], '5'),
      activity('挑戰：圓形工具包', '保留 circle_area，再完成 circle_length(radius)。依序輸出面積、周長，各一行；函式要回傳數值。', 'import math\n\ndef circle_area(radius):\n    return math.pi * radius ** 2\n\ndef circle_length(radius):\n    return 0  # 補上周長公式\n\nradius = float(input())\nprint(circle_area(radius))\nprint(circle_length(radius))', 'import math\n\ndef circle_area(radius):\n    return math.pi * radius ** 2\n\ndef circle_length(radius):\n    return 2 * math.pi * radius\n\nradius = float(input())\nprint(circle_area(radius))\nprint(circle_length(radius))', [test('半徑 5', '5', `${Math.PI * 25}\n${2 * Math.PI * 5}`, { numeric: true, requires: ['FunctionDef'] }), test('半徑 0', '0', '0\n0', { numeric: true }), test('函式可重用', '1', `${Math.PI}\n${2 * Math.PI}\n${6 * Math.PI}`, { numeric: true, probe: 'print(circle_length(3))' })], ['圓周長公式是 2 × π × 半徑。', '函式內 return 2 * math.pi * radius，輸出由呼叫處負責。'], '5')
    ]
  },
  {
    id: 10, title: '購物結帳小幫手', subtitle: '整合你的 Python 工具', level: '綜合專題', source: [7, 9, 10], syntax: ['list', 'while', 'def', 'if'],
    goal: '整合清單、函式、迴圈與條件，完成可測試的結帳程式。', bridge: '像 Scratch 專題一樣，先把大任務拆成「讀取、累計、判斷、輸出」，再組合起來。',
    concepts: [['商品編號與索引', '商品編號 1、2、3 對應清單索引 0、1、2，使用 prices[code - 1]。'], ['函式分工', 'cart_total(cart) 負責加總，主程式負責讀取與顯示。'], ['三種情況都測試', '餘額足夠、不足、沒有購買。輸入 -1 表示結束選購。']], exit: '說明你如何拆分程式。選一組原本失敗的案例，解釋修正後為何通過。',
    activities: [
      activity('觀察：單次結帳', '商品 1：筆記本 100 元，商品 2：隨身碟 200 元，商品 3：滑鼠 300 元。第一行餘額，第二行商品編號。', 'prices = [100, 200, 300]\nbalance = int(input())\ncode = int(input())\nprice = prices[code - 1]\nprint("商品金額", price)\nprint("剩餘金額", balance - price)', 'prices = [100, 200, 300]\nbalance = int(input())\ncode = int(input())\nprice = prices[code - 1]\nprint("商品金額", price)\nprint("剩餘金額", balance - price)', [], ['商品編號 2 的價格存在 prices[1]。'], '500\n2', '商品金額 200\n剩餘金額 300'),
      activity('引導：收集購物清單', '每行輸入商品編號 1～3，以 -1 結束。把價格加入 cart，完成 cart_total()，最後只輸出總額。', 'prices = [100, 200, 300]\n\ndef cart_total(cart):\n    total = 0\n    for price in cart:\n        pass  # 補上加總\n    return total\n\ncart = []\nwhile True:\n    code = int(input())\n    if code == -1:\n        break\n    # 加入商品價格\nprint(cart_total(cart))', 'prices = [100, 200, 300]\n\ndef cart_total(cart):\n    total = 0\n    for price in cart:\n        total += price\n    return total\n\ncart = []\nwhile True:\n    code = int(input())\n    if code == -1:\n        break\n    cart.append(prices[code - 1])\nprint(cart_total(cart))', [test('兩件商品', '1\n3\n-1', '400', { requires: ['While', 'FunctionDef'] }), test('重複購買', '2\n2\n-1', '400'), test('沒有購買', '-1', '0'), test('加總函式', '-1', '0\n12', { probe: 'print(cart_total([5, 7]))' })], ['函式內 total += price；選購迴圈內加入價格。', 'cart.append(prices[code - 1]) 把商品價格放進清單。'], '1\n3\n-1'),
      activity('挑戰：完整結帳', '第一行是餘額，接著每行商品編號 1～3，以 -1 結束。足額時輸出「結帳成功，餘額剩X元」，不足時輸出「餘額不足，請另外加值X元」。保留 cart_total() 的分工。', 'prices = [100, 200, 300]\n\ndef cart_total(cart):\n    total = 0\n    for price in cart:\n        total += price\n    return total\n\nbalance = int(input())\ncart = []\nwhile True:\n    code = int(input())\n    if code == -1:\n        break\n    cart.append(prices[code - 1])\n\ntotal = cart_total(cart)\n# 補上餘額判斷與兩種結果\nprint("請完成結帳")', 'prices = [100, 200, 300]\n\ndef cart_total(cart):\n    total = 0\n    for price in cart:\n        total += price\n    return total\n\nbalance = int(input())\ncart = []\nwhile True:\n    code = int(input())\n    if code == -1:\n        break\n    cart.append(prices[code - 1])\n\ntotal = cart_total(cart)\nif balance >= total:\n    print("結帳成功，餘額剩", balance - total, "元", sep="")\nelse:\n    print("餘額不足，請另外加值", total - balance, "元", sep="")', [test('餘額足夠', '1000\n1\n3\n-1', '結帳成功，餘額剩600元', { requires: ['While', 'FunctionDef'] }), test('餘額不足', '100\n2\n3\n-1', '餘額不足，請另外加值400元'), test('沒有購買', '500\n-1', '結帳成功，餘額剩500元'), test('餘額恰好', '200\n2\n-1', '結帳成功，餘額剩0元')], ['先比較 balance 與 total，足額時減總額，不足時算差額。', '使用 if balance >= total；print(..., sep="") 可以組合沒有空格的訊息。'], '1000\n1\n3\n-1')
    ]
  }
];

export const dictionary = [
  { id: 'strings', name: '字串・組合與切片', desc: '字串以引號包住，可用 + 組合、* 重複，或用索引與切片取出內容。', format: 'word[索引]\nword[起點:終點]', example: 'word = "Python"\nprint(word[0])\nprint(word[1:4])\nprint("Hi" * 2)', output: 'P\nyth\nHiHi', mistake: '索引從 0 開始；切片不包含終點。字串加數字前要先轉換型態。', scratch: '「連接」「字串的第幾個字」「字串長度」', url: 'https://docs.python.org/3/tutorial/introduction.html#strings' },
  { id: 'encoding', name: 'ord / chr・字元與碼位', desc: 'ord() 取得一個字元的 Unicode 碼位；chr() 將碼位轉為字元。ASCII 字元位於 0～127，中文字通常超出這個範圍。', format: 'ord("A")\nchr(65)', example: 'print(ord("A"))\nprint(chr(66))\nprint(ord("中"))', output: '65\nB\n20013', mistake: 'ord() 的字串只能有一個 Unicode 碼位；碼位與 UTF-8 位元組不同。可用小幫手的編碼工具比較。', scratch: '延伸認識電腦如何用數字表示文字', url: 'https://docs.python.org/3/library/functions.html#ord' },
  { id: 'bases', name: 'bin / hex・數字的不同寫法', desc: '同一個整數可以用二進位或十六進位表示。bin() 與 hex() 的結果是帶前綴的字串。', format: 'bin(數字)\nhex(數字)\nint("二進位文字", 2)', example: 'print(bin(65))\nprint(hex(65))\nprint(int("1000001", 2))', output: '0b1000001\n0x41\n65', mistake: '0b 表示二進位，0x 表示十六進位；字串內容必須符合指定進位。', scratch: '延伸認識同一個數字的不同表示法', url: 'https://docs.python.org/3/library/functions.html#bin' },
  { id: 'pass', name: 'pass・暫時佔位', desc: '程式區塊還沒寫好時，先用 pass 佔住位置。它不執行任何動作，完成任務時應以自己的邏輯取代。', format: 'for i in range(3):\n    pass  # 等待補寫', example: 'for i in range(3):\n    pass\nprint("區塊可以稍後補寫")', output: '區塊可以稍後補寫', mistake: 'pass 不會停止迴圈，也不會跳出程式；它只是沒有動作。', scratch: '暫時保留待補寫的積木區塊', url: 'https://docs.python.org/3/tutorial/controlflow.html#pass-statements' },
  { id: 'print', name: 'print()・輸出', desc: '把資料顯示在輸出區。多個值預設以空格分隔，每次呼叫後換行。', format: 'print(值1, 值2, sep=" ", end="\\n")', example: 'print("How", "are", "you?", sep="@")', output: 'How@are@you?', mistake: '使用半形引號。sep 控制值之間的分隔，end 控制最後的結尾。', scratch: '「說出」積木', url: 'https://docs.python.org/3/library/functions.html#print' },
  { id: 'comments', name: '#・註解', desc: '寫給人看的說明，不會當成程式執行。', format: '# 說明文字', example: '# 輸出一則訊息\nprint("Hello")', output: 'Hello', mistake: '註解不能取代需要執行的動作。', scratch: '積木的註解', url: 'https://docs.python.org/3/tutorial/introduction.html' },
  { id: 'variables', name: '=・變數與指定值', desc: '以名稱記住資料；右側先算出結果，再存入左側變數。', format: '變數名稱 = 值', example: 'count = 2\ncount = count + 1\nprint(count)', output: '3', mistake: '= 是指定值，== 才是比較相等。不要用 str、list 等內建名稱命名變數。', scratch: '「將變數設為」', url: 'https://docs.python.org/3/tutorial/introduction.html#numbers' },
  { id: 'input', name: 'input()・讀取輸入', desc: '每次讀取一行，回傳字串。本課程先在輸入區準備各行資料。', format: 'name = input()\nnumber = int(input())', example: 'name = input()\nprint("哈囉", name)', input: '小安', output: '哈囉 小安', mistake: 'input() 不會自動變成數字；讀取次數超過提供行數，會出現 EOFError。', scratch: '「詢問並等待」與「答案」', url: 'https://docs.python.org/3/library/functions.html#input' },
  { id: 'types', name: 'int / float / str / type・型態', desc: '整數、小數、字串與型態觀察。bool 的值為 True 或 False。', format: 'int("80")\nfloat("3.5")\nstr(80)\ntype(80)', example: 'text = "80"\nprint(text + text)\nprint(int(text) + int(text))', output: '8080\n160', mistake: 'int("3.5") 會失敗；小數文字使用 float()。字串與數字不能直接相加。', scratch: 'Scratch 常隱含轉換；Python 要確認型態', url: 'https://docs.python.org/3/library/functions.html#int' },
  { id: 'operators', name: '+ - * / // % **・運算', desc: '+ 加、- 減、* 乘、/ 除、// 向下取整除法、% 餘數、** 次方。', format: '(a + b) / 2', example: 'print(7 / 2)\nprint(7 // 2)\nprint(7 % 2)\nprint(3 ** 2)', output: '3.5\n3\n1\n9', mistake: '括號改變運算順序；除數不能是 0。', scratch: '運算積木', url: 'https://docs.python.org/3/tutorial/introduction.html#numbers' },
  { id: 'comparisons', name: '== != < > <= >=・比較', desc: '比較兩個值，結果為 True 或 False。', format: 'score >= 60', example: 'print(60 >= 60)\nprint(3 == 5)', output: 'True\nFalse', mistake: '條件中的相等使用 ==，不是 =。', scratch: '比較積木', url: 'https://docs.python.org/3/library/stdtypes.html#comparisons' },
  { id: 'logic', name: 'and / or / not・邏輯', desc: 'and 要同時成立；or 至少一個成立；not 反轉真假。', format: '條件1 or 條件2', example: 'pressure = 25\ntread = 1.8\nprint(pressure < 30 or tread < 1.6)', output: 'True', mistake: '依題意選擇 and 或 or，測試只有一個條件成立的情況。', scratch: '「且」「或」「不成立」', url: 'https://docs.python.org/3/library/stdtypes.html#boolean-operations-and-or-not' },
  { id: 'if', name: 'if / elif / else・分支', desc: '依條件選擇執行內容。elif 可加入其他條件；else 是都不成立時的分支。', format: 'if 條件:\n    動作\nelif 其他條件:\n    動作\nelse:\n    動作', example: 'score = 60\nif score >= 60:\n    print("及格")\nelse:\n    print("再加油")', output: '及格', mistake: '不要漏掉冒號；同一層的縮排要一致，建議四個空格。', scratch: '「如果…否則」', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements' },
  { id: 'range', name: 'range()・整數範圍', desc: '指定起點、終點與步長；起點預設為 0，終點不包含。', format: 'range(終點)\nrange(起點, 終點, 步長)', example: 'for i in range(1, 4):\n    print(i)', output: '1\n2\n3', mistake: '包含 100 的範圍是 range(1, 101)。', scratch: '固定次數重複的數值來源', url: 'https://docs.python.org/3/tutorial/controlflow.html#the-range-function' },
  { id: 'for', name: 'for・走訪與重複', desc: '依序取出範圍或清單裡的每個值，執行縮排內的動作。', format: 'for 變數 in 範圍或清單:\n    動作', example: 'for number in [2, 4, 6]:\n    print(number * 2)', output: '4\n8\n12', mistake: '迴圈內外由縮排決定。巢狀迴圈要再多一層縮排。', scratch: '重複積木與清單走訪', url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements' },
  { id: 'accumulator', name: '+=・累加與更新', desc: '在原本的值上增加資料。例如 total += n 等同 total = total + n。', format: 'total = 0\ntotal += number', example: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)', output: '6', mistake: '累加器初始化放在迴圈外；放在內部會每輪重新歸零。', scratch: '「變數改變」', url: 'https://docs.python.org/3/reference/simple_stmts.html#augmented-assignment-statements' },
  { id: 'while', name: 'while・條件迴圈', desc: '條件成立時繼續重複；條件不成立時離開。', format: 'while 條件:\n    動作\n    更新狀態', example: 'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1', output: '1\n2\n3', mistake: '忘記更新狀態可能形成無限迴圈。執行前先確認停止方式。', scratch: '「重複直到」的條件方向相反', url: 'https://docs.python.org/3/tutorial/introduction.html#first-steps-towards-programming' },
  { id: 'break', name: 'break / continue・迴圈控制', desc: 'break 離開目前這一層迴圈；continue 跳過本輪剩下內容。', format: 'if 停止條件:\n    break', example: 'for i in range(1, 6):\n    if i == 3:\n        continue\n    if i == 5:\n        break\n    print(i)', output: '1\n2\n4', mistake: 'continue 可能跳過變數更新；break 只離開最內層迴圈。', scratch: '停止與跳過流程', url: 'https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements' },
  { id: 'list', name: 'list・清單與索引', desc: '方括號建立有序、可修改的清單；索引從 0 開始。', format: 'items = [值1, 值2]\nitems[0]\nitems.append(新值)\ndel items[0]', example: 'items = [10, 20]\nitems.append(30)\nprint(items[0])\nprint(items[1:3])', output: '10\n[20, 30]', mistake: '清單長度為 3 時，最後一個索引是 2。切片終點也不包含。', scratch: '清單第一項為 1；Python 為 0', url: 'https://docs.python.org/3/tutorial/introduction.html#lists' },
  { id: 'len', name: 'len()・長度', desc: '取得清單的項目數量，也能取得字串長度。', format: 'len(清單或字串)', example: 'print(len([80, 90, 70]))\nprint(len([]))', output: '3\n0', mistake: '空清單的長度為 0，不能直接當平均值的除數。', scratch: '「清單長度」', url: 'https://docs.python.org/3/library/functions.html#len' },
  { id: 'def', name: 'def・定義函式', desc: '把一段可重用程式命名，並透過參數接收資料。', format: 'def 函式名稱(參數):\n    return 結果', example: 'def add(a, b):\n    return a + b\n\nprint(add(3, 5))', output: '8', mistake: '定義函式不會立即執行內容；要呼叫它。函式內要縮排。', scratch: '自訂積木與參數', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' },
  { id: 'return', name: 'return・回傳結果', desc: '結束函式，將結果交回呼叫處。沒有 return 時回傳 None。', format: 'return 計算結果', example: 'def square(number):\n    return number * number\n\nresult = square(4)\nprint(result + 1)', output: '17', mistake: 'print 顯示結果，return 回傳結果；兩者用途不同。', scratch: '函式回傳值是自訂積木的新延伸', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' },
  { id: 'import', name: 'import・匯入模組', desc: '使用 Python 已有的工具。核心課程使用標準庫 math。', format: 'import math\nmath.pi\nmath.sqrt(數值)', example: 'import math\nprint(math.sqrt(16))', output: '4.0', mistake: '使用 math.pi 之前先 import math。Tkinter 不適用於本網站執行區。', scratch: '類似加入擴充工具', url: 'https://docs.python.org/3/tutorial/modules.html' }
];
