// 本地參考內容：不載入外部網頁、影片或搜尋結果。
export const errors = [
  { name: 'SyntaxError・語法格式', desc: '先看錯誤行與前一行，檢查半形引號、括號與冒號是否成對。', bad: 'if score >= 60\n    print("及格")', good: 'if score >= 60:\n    print("及格")', tip: 'Python 使用半形 : ( ) "，不要用中文全形符號。' },
  { name: 'IndentationError / TabError・縮排', desc: 'if、for、while、def 的內容向右縮排；同一層對齊。', bad: 'for i in range(3):\nprint(i)', good: 'for i in range(3):\n    print(i)', tip: '本網站按 Tab 插入四個空格。不要混用不同的縮排寬度。' },
  { name: 'NameError・名稱還沒建立', desc: '先指定值，再使用名稱；大小寫不同會視為不同名稱。', bad: 'Score = 80\nprint(score)', good: 'score = 80\nprint(score)', tip: '逐字比較名稱，並確認定義那一行有先執行。' },
  { name: 'TypeError・文字和數字混用', desc: 'input() 得到文字。運算前先確認是否需要轉成數字。', bad: 'age = "13"\nprint(age + 1)', good: 'age = "13"\nprint(int(age) + 1)', tip: '要組合文字則用 str()，例如 "年齡：" + str(13)。' },
  { name: 'ValueError・無法轉換內容', desc: '轉換函式需要符合格式的資料，例如整數文字不能含小數點。', bad: 'number = int("3.5")', good: 'number = float("3.5")', tip: 'int(input()) 需要整數；檢查輸入區是否有空白行或文字。' },
  { name: 'IndexError・清單索引超出範圍', desc: '長度為 3 的清單，其非負索引為 0、1、2。', bad: 'items = [10, 20, 30]\nprint(items[3])', good: 'items = [10, 20, 30]\nprint(items[2])', tip: '最後一項可以用 items[-1]，但空清單沒有任何可存取的項目。' },
  { name: 'ZeroDivisionError・除以零', desc: '除法、取餘數與計算平均之前，確認除數不為 0。', bad: 'scores = []\nprint(sum(scores) / len(scores))', good: 'scores = []\nif len(scores) > 0:\n    print(sum(scores) / len(scores))\nelse:\n    print("沒有資料")', tip: '測試「沒有資料」的情況，能提早發現問題。' },
  { name: 'EOFError・輸入資料用完了', desc: '每一次 input() 都會取下一行。程式需要兩行，就要先準備兩行。', bad: 'name = input()\nage = int(input())\n# 輸入區只有一行：小安', good: '# 輸入區準備兩行：\n# 小安\n# 13\nname = input()\nage = int(input())', tip: 'while 讀取資料的任務也要提供停止值，例如 -1。' },
  { name: '執行逾時・迴圈停不下來', desc: '列出停止條件，確認每輪都有更新相關變數。網站會在 8 秒後停止執行。', bad: 'count = 1\nwhile count <= 3:\n    print(count)', good: 'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1', tip: '可以先按「停止」，再檢查更新位置與 break 的條件。' },
  { name: '結果不符合預期・邏輯與格式', desc: '程式可以執行，但不代表答案正確。先用小數字逐步追蹤，再比較預期輸出。', bad: 'total = 0\nfor i in range(1, 4):\n    total = i\nprint(total)', good: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)', tip: '核對空格、換行、range 的終點，以及累加器是否在迴圈外歸零。' }
];

export const extensions = [
  { name: '容器速查：list、tuple、dict、set', desc: '第 8 課以 list 為核心。tuple 適合不更換項目的序列；dict 用鍵查值；set 收集不重複項目。它們用途不同，不必全稱作陣列。', code: 'scores = [80, 90]         # 清單：有順序，可修改\npoint = (3, 5)            # 元組：項目不可更換\nstudent = {"name": "小安"} # 字典：用鍵查值\ncolors = {"藍", "黃", "藍"} # 集合：不重複\nprint(student["name"])\nprint(len(colors))', output: '小安\n2', tip: '空集合用 set()；{} 是空字典。字典的鍵與清單的索引用途不同。' },
  { name: '字串：組合、重複與切片', desc: '文字也能取出部分內容。索引從 0 開始，切片不包含終點。第 3 課先理解型態，再練習這些操作。', code: 'word = "Python"\nprint(word[0])\nprint(word[1:4])\nprint("Hi" * 2)', output: 'P\nyth\nHiHi', tip: '字串不能直接更換其中一個字元；可用切片組合出新字串。' },
  { name: '排序：逐輪找出最小值', desc: '原教材的選擇排序可作第 8 課延伸。每輪從尚未處理的位置找最小值，交換到前面。先用三筆資料追蹤兩輪即可。', code: 'values = [30, 10, 20]\nfor start in range(len(values) - 1):\n    smallest = start\n    for index in range(start + 1, len(values)):\n        if values[index] < values[smallest]:\n            smallest = index\n    values[start], values[smallest] = values[smallest], values[start]\nprint(values)', output: '[10, 20, 30]', tip: '需要巢狀迴圈和索引基礎；不列入十課的必修挑戰。' },
  { name: 'Tkinter：標籤、按鈕與事件', desc: 'Label 顯示文字，Button 接收點擊，command 指定點擊時呼叫的函式。這與 Scratch 的「當角色被點擊」很接近。Tkinter 需要桌面視窗環境，本站 Python 執行區不支援。', code: '# 桌面 Python 延伸示意，請勿貼到本站執行區\nimport tkinter as tk\n\nwindow = tk.Tk()\nlabel = tk.Label(window, text="準備好了")\nlabel.pack()\n\ndef greet():\n    label.config(text="哈囉，小安！")\n\ntk.Button(window, text="打招呼", command=greet).pack()\nwindow.mainloop()', tip: 'command=greet 交出函式，command=greet() 則會立刻呼叫。下方可在本頁體驗事件流程。', demo: true },
  { name: '線上編輯器與 Notebook：現在用哪個？', desc: '原資料列出 Trinket、OnlineGDB、Colab、Jupyter 等工具。本課已整合編輯、輸入、執行、輸出與驗證，學生可直接在目前網站完成十課。', tip: 'Notebook 常保留先前儲存格的變數；本網站每次執行重新建立學生變數，程式要包含完整步驟。平台連結與影片保留在教師原始資料，不需在課堂中另外開啟。' }
];
