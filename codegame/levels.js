/* Code Hour 關卡地圖與限制；來源與校對資料見 source-levels.json。 */
(function (root) {
    'use strict';
    const levels = [
  {
    "id": "1-1",
    "group": 1,
    "number": 1,
    "title": "第一盞燈",
    "sourceName": "DOJOONE",
    "board": [
      [
        null,
        null,
        null
      ],
      [
        0,
        0,
        0
      ],
      [
        null,
        null,
        null
      ]
    ],
    "goals": [
      [
        1,
        2
      ]
    ],
    "start": {
      "row": 1,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 3,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "light"
    ]
  },
  {
    "id": "1-2",
    "group": 1,
    "number": 2,
    "title": "轉彎前進",
    "sourceName": "DOJOTURN",
    "board": [
      [
        0,
        0,
        0
      ],
      [
        0,
        null,
        0
      ],
      [
        0,
        null,
        0
      ]
    ],
    "goals": [
      [
        2,
        2
      ]
    ],
    "start": {
      "row": 2,
      "col": 0,
      "direction": 3
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "light"
    ]
  },
  {
    "id": "1-3",
    "group": 1,
    "number": 3,
    "title": "跳上階梯",
    "sourceName": "DOJOJUMP",
    "board": [
      [
        1,
        0
      ],
      [
        2,
        3
      ]
    ],
    "goals": [
      [
        1,
        1
      ]
    ],
    "start": {
      "row": 0,
      "col": 1,
      "direction": 2
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "1-4",
    "group": 1,
    "number": 4,
    "title": "跨越高低",
    "sourceName": "BASIC_codehour",
    "board": [
      [
        0,
        0,
        0
      ],
      [
        1,
        1,
        1
      ],
      [
        0,
        0,
        0
      ],
      [
        1,
        1,
        1
      ],
      [
        2,
        2,
        2
      ]
    ],
    "goals": [
      [
        4,
        2
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "1-5",
    "group": 1,
    "number": 5,
    "title": "三個目標",
    "sourceName": "DOJOTHREE",
    "board": [
      [
        0,
        0,
        0
      ],
      [
        1,
        0,
        0
      ],
      [
        1,
        1,
        2
      ]
    ],
    "goals": [
      [
        0,
        2
      ],
      [
        1,
        0
      ],
      [
        2,
        2
      ]
    ],
    "start": {
      "row": 2,
      "col": 2,
      "direction": 2
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "1-6",
    "group": 1,
    "number": 6,
    "title": "探索高台",
    "sourceName": "BASICFINAL2",
    "board": [
      [
        0,
        0,
        1
      ],
      [
        0,
        0,
        1
      ],
      [
        2,
        2,
        2
      ],
      [
        3,
        0,
        0
      ],
      [
        3,
        0,
        0
      ]
    ],
    "goals": [
      [
        2,
        2
      ],
      [
        4,
        0
      ]
    ],
    "start": {
      "row": 0,
      "col": 1,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "1-7",
    "group": 1,
    "number": 7,
    "title": "點亮四角",
    "sourceName": "BASICFINAL3",
    "board": [
      [
        0,
        1,
        0
      ],
      [
        0,
        2,
        1
      ]
    ],
    "goals": [
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        1,
        1
      ],
      [
        1,
        2
      ]
    ],
    "start": {
      "row": 1,
      "col": 0,
      "direction": 3
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "1-8",
    "group": 1,
    "number": 8,
    "title": "階梯巡航",
    "sourceName": "BASICFINAL4",
    "board": [
      [
        0,
        0,
        0
      ],
      [
        0,
        1,
        0
      ],
      [
        0,
        2,
        2
      ],
      [
        2,
        1,
        1
      ]
    ],
    "goals": [
      [
        3,
        0
      ],
      [
        3,
        1
      ],
      [
        3,
        2
      ]
    ],
    "start": {
      "row": 0,
      "col": 1,
      "direction": 1
    },
    "capacity": {
      "main": 12,
      "p1": 0,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light"
    ]
  },
  {
    "id": "2-1",
    "group": 2,
    "number": 1,
    "title": "第一次用 P1",
    "sourceName": "PROC1_codehour",
    "board": [
      [
        1,
        1,
        1,
        1
      ],
      [
        null,
        null,
        null,
        1
      ],
      [
        null,
        null,
        null,
        1
      ],
      [
        1,
        1,
        1,
        1
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        3
      ],
      [
        3,
        3
      ]
    ],
    "start": {
      "row": 3,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "2-2",
    "group": 2,
    "number": 2,
    "title": "長路拆成程序",
    "sourceName": "PROC_JR2",
    "board": [
      [
        0,
        0,
        null,
        null,
        null
      ],
      [
        null,
        0,
        0,
        null,
        null
      ],
      [
        null,
        null,
        0,
        0,
        null
      ],
      [
        null,
        null,
        null,
        0,
        0
      ],
      [
        null,
        null,
        null,
        null,
        0
      ]
    ],
    "goals": [
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "2-3",
    "group": 2,
    "number": 3,
    "title": "重複的階梯",
    "sourceName": "PROCPATTERN",
    "board": [
      [
        0,
        0,
        0,
        0
      ],
      [
        1,
        1,
        1,
        1
      ],
      [
        2,
        2,
        2,
        2
      ]
    ],
    "goals": [
      [
        0,
        3
      ],
      [
        1,
        0
      ],
      [
        2,
        3
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "2-4",
    "group": 2,
    "number": 4,
    "title": "加入 P2",
    "sourceName": "PROC2_codehour",
    "board": [
      [
        2,
        2,
        2,
        2,
        2
      ],
      [
        2,
        null,
        null,
        null,
        null
      ],
      [
        2,
        2,
        2,
        2,
        2
      ],
      [
        null,
        null,
        null,
        null,
        2
      ],
      [
        2,
        2,
        2,
        2,
        2
      ]
    ],
    "goals": [
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        0,
        3
      ],
      [
        0,
        4
      ],
      [
        2,
        0
      ],
      [
        2,
        1
      ],
      [
        2,
        2
      ],
      [
        2,
        3
      ],
      [
        4,
        1
      ],
      [
        4,
        2
      ],
      [
        4,
        3
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 4,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 8
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1",
      "p2"
    ]
  },
  {
    "id": "2-5",
    "group": 2,
    "number": 5,
    "title": "三排階梯",
    "sourceName": "PROC3_HOC2016",
    "board": [
      [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        3,
        2,
        1,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        3,
        2,
        1,
        0
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        0,
        3
      ],
      [
        2,
        1
      ],
      [
        2,
        2
      ],
      [
        2,
        3
      ],
      [
        2,
        4
      ],
      [
        4,
        2
      ],
      [
        4,
        3
      ],
      [
        4,
        4
      ],
      [
        4,
        5
      ]
    ],
    "start": {
      "row": 4,
      "col": 5,
      "direction": 2
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 8
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1",
      "p2"
    ]
  },
  {
    "id": "2-6",
    "group": 2,
    "number": 6,
    "title": "四座平台",
    "sourceName": "PROC4_codehour",
    "board": [
      [
        1,
        1,
        0,
        1,
        1
      ],
      [
        1,
        1,
        0,
        1,
        1
      ],
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        1,
        1,
        0,
        1,
        1
      ],
      [
        1,
        1,
        0,
        1,
        1
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        0
      ],
      [
        1,
        1
      ],
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        3,
        0
      ],
      [
        3,
        1
      ],
      [
        3,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        0
      ],
      [
        4,
        1
      ],
      [
        4,
        3
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 4,
      "col": 4,
      "direction": 2
    },
    "capacity": {
      "main": 12,
      "p1": 8,
      "p2": 8
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1",
      "p2"
    ]
  },
  {
    "id": "3-1",
    "group": 3,
    "number": 1,
    "title": "前進再呼叫自己",
    "sourceName": "LOOP_JR1",
    "board": [
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "goals": [
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ]
    ],
    "start": {
      "row": 1,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 1,
      "p1": 3,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "3-2",
    "group": 3,
    "number": 2,
    "title": "跳躍再呼叫自己",
    "sourceName": "LOOP_JR2",
    "board": [
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        1,
        2,
        3,
        2,
        1,
        2
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "goals": [
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ]
    ],
    "start": {
      "row": 1,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 1,
      "p1": 3,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "3-3",
    "group": 3,
    "number": 3,
    "title": "環形巡邏",
    "sourceName": "LOOP1_codehour",
    "board": [
      [
        2,
        2,
        1,
        2,
        2
      ],
      [
        2,
        0,
        0,
        0,
        2
      ],
      [
        1,
        0,
        0,
        0,
        1
      ],
      [
        2,
        0,
        0,
        0,
        2
      ],
      [
        2,
        2,
        1,
        2,
        2
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        2
      ],
      [
        0,
        4
      ],
      [
        2,
        0
      ],
      [
        2,
        4
      ],
      [
        4,
        0
      ],
      [
        4,
        2
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 4,
      "col": 1,
      "direction": 2
    },
    "capacity": {
      "main": 1,
      "p1": 8,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "3-4",
    "group": 3,
    "number": 4,
    "title": "階梯循環",
    "sourceName": "LOOP2_codehour",
    "board": [
      [
        1,
        1,
        null,
        null,
        null
      ],
      [
        null,
        1,
        1,
        null,
        null
      ],
      [
        null,
        null,
        1,
        1,
        null
      ],
      [
        null,
        null,
        null,
        1,
        1
      ],
      [
        null,
        null,
        null,
        null,
        1
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        1,
        1
      ],
      [
        2,
        2
      ],
      [
        3,
        3
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 1,
      "p1": 8,
      "p2": 0
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1"
    ]
  },
  {
    "id": "3-5",
    "group": 3,
    "number": 5,
    "title": "周界點燈",
    "sourceName": "LOOP3_codehour",
    "board": [
      [
        2,
        1,
        1,
        1,
        2
      ],
      [
        1,
        0,
        0,
        0,
        1
      ],
      [
        1,
        0,
        0,
        0,
        1
      ],
      [
        1,
        0,
        0,
        0,
        1
      ],
      [
        2,
        1,
        1,
        1,
        2
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        2
      ],
      [
        0,
        3
      ],
      [
        0,
        4
      ],
      [
        1,
        0
      ],
      [
        1,
        4
      ],
      [
        2,
        0
      ],
      [
        2,
        4
      ],
      [
        3,
        0
      ],
      [
        3,
        4
      ],
      [
        4,
        0
      ],
      [
        4,
        1
      ],
      [
        4,
        2
      ],
      [
        4,
        3
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 1,
      "p1": 8,
      "p2": 8
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1",
      "p2"
    ]
  },
  {
    "id": "3-6",
    "group": 3,
    "number": 6,
    "title": "四角迴圈",
    "sourceName": "LOOP4_codehour",
    "board": [
      [
        0,
        1,
        0,
        1,
        0
      ],
      [
        1,
        1,
        0,
        1,
        1
      ],
      [
        0,
        0,
        1,
        0,
        0
      ],
      [
        1,
        1,
        0,
        1,
        1
      ],
      [
        0,
        1,
        0,
        1,
        0
      ]
    ],
    "goals": [
      [
        0,
        0
      ],
      [
        0,
        4
      ],
      [
        1,
        1
      ],
      [
        1,
        3
      ],
      [
        3,
        1
      ],
      [
        3,
        3
      ],
      [
        4,
        0
      ],
      [
        4,
        4
      ]
    ],
    "start": {
      "row": 0,
      "col": 0,
      "direction": 0
    },
    "capacity": {
      "main": 1,
      "p1": 8,
      "p2": 8
    },
    "commands": [
      "forward",
      "left",
      "right",
      "jump",
      "light",
      "p1",
      "p2"
    ]
  }
];
    if (typeof module === 'object' && module.exports) module.exports = levels;
    else root.CodeGameLevels = levels;
})(typeof globalThis !== 'undefined' ? globalThis : this);
