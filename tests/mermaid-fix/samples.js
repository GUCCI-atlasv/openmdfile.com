/* Mermaid fixer test set.
   `broken`: diagrams that fail to render, written the way ChatGPT / Claude /
   Gemini typically get Mermaid wrong (prose around code, fences, full-width
   punctuation, unquoted brackets, `end` nodes, wrong arrows …). A few are
   deliberately beyond rule-based repair so the score stays honest.
   `valid`: regression guard — the fixer must leave these untouched. */
window.MMD_SAMPLES={broken:[
/* ---- 1. code fences ---- */
{id:'fence-01',src:'chatgpt',code:'```mermaid\nflowchart TD\n    A[Start] --> B[Load config]\n    B --> C[Run]\n```'},
{id:'fence-02',src:'claude',code:'```mermaid\nsequenceDiagram\n    participant U as User\n    participant S as Server\n    U->>S: GET /login\n    S-->>U: 200 OK\n```'},
{id:'fence-03',src:'gemini',code:'```\ngraph LR\n  A --> B\n  B --> C\n```'},
{id:'fence-04',src:'chatgpt',code:'~~~mermaid\nerDiagram\n    CUSTOMER ||--o{ ORDER : places\n~~~'},
{id:'fence-05',src:'claude',code:'```mermaid\npie title Traffic sources\n    "Search" : 52\n    "Direct" : 31\n    "Social" : 17\n```'},
{id:'fence-06',src:'chatgpt',code:'```mermaid\nclassDiagram\n    class Animal {\n        +String name\n        +eat()\n    }\n    Animal <|-- Dog\n```'},

/* ---- 2. unquoted brackets / parens / braces in labels ---- */
{id:'paren-01',src:'chatgpt',code:'flowchart TD\n    A[Start (init)] --> B[Load data]\n    B --> C[Done]'},
{id:'paren-02',src:'claude',code:'flowchart LR\n    A[User Request] --> B{Valid input (y/n)?}\n    B -->|Yes| C[Process]\n    B -->|No| D[Return error (400)]'},
{id:'paren-03',src:'gemini',code:'graph TD\n    A[Read file (UTF-8)] --> B[Parse rows]\n    B --> C[Write to DB (Postgres)]'},
{id:'paren-04',src:'chatgpt',code:'flowchart TD\n    A[Call API [v2]] --> B[Handle response]'},
{id:'paren-05',src:'claude',code:'flowchart TD\n    A[Config {json}] --> B[Validate]\n    B --> C[Apply]'},
{id:'paren-06',src:'chatgpt',code:'flowchart TD\n    A(Start (here)) --> B(Next step)\n    B --> C(End (finish))'},
{id:'paren-07',src:'gemini',code:'flowchart LR\n    A[/api/users] --> B[UserController]\n    B --> C[(Database)]'},
{id:'paren-08',src:'claude',code:'flowchart TD\n    S[Submit form] --> V{Is email valid (regex)?}\n    V -->|Yes (200)| OK[Save]\n    V -->|No| E[Show error]'},
{id:'paren-09',src:'chatgpt',code:'flowchart TD\n    A[Step 1: Collect data (surveys, interviews)] --> B[Step 2: Analyse]\n    B --> C[Step 3: Report (PDF)]'},
{id:'paren-10',src:'gemini',code:'flowchart TD\n    A[Install deps (npm i)] --> B[Build (npm run build)]\n    B --> C[Deploy (wrangler)]'},
{id:'paren-11',src:'claude',code:'flowchart TD\n    A[Array[0]] --> B[Array[1]]'},
{id:'paren-12',src:'chatgpt',code:'flowchart TD\n    A[Price: $5 (incl. tax)] --> B[Checkout]'},

/* ---- 3. quotes inside labels ---- */
{id:'quote-01',src:'chatgpt',code:'flowchart TD\n    A[Say \"hello\"] --> B[Wave back]'},
{id:'quote-02',src:'claude',code:'flowchart TD\n    A[Click "Submit"] --> B[Server validates]'},
{id:'quote-03',src:'gemini',code:'flowchart LR\n    A["The "best" option"] --> B["Another "choice""]'},
{id:'quote-04',src:'chatgpt',code:'flowchart TD\n    A{Ready?} -->|say \"yes\"| B[Go]\n    A -->|no| C[Wait]'},
{id:'quote-05',src:'claude',code:'flowchart TD\n    Q{User types "quit"?} -->|Yes| X[Exit]\n    Q -->|No| L[Loop]'},

/* ---- 4. `end` as a node id ---- */
{id:'end-01',src:'chatgpt',code:'flowchart TD\n    start --> process\n    process --> end'},
{id:'end-02',src:'claude',code:'flowchart TD\n    A[Begin] --> B{Check}\n    B -->|ok| end[Finish]\n    B -->|fail| A'},
{id:'end-03',src:'gemini',code:'graph LR\n    start((Start)) --> work[Work]\n    work --> end((End))'},
{id:'end-04',src:'chatgpt',code:'flowchart TD\n    subgraph Pipeline\n        build --> test\n    end\n    test --> end'},
{id:'end-05',src:'claude',code:'flowchart TD\n    A --> end\n    style end fill:#f96'},

/* ---- 5. full-width punctuation ---- */
{id:'fw-01',src:'chatgpt',code:'flowchart TD\n    A[开始] → B[处理数据]\n    B → C[结束]'},
{id:'fw-02',src:'claude',code:'sequenceDiagram\n    participant 用户\n    participant 服务器\n    用户->>服务器：发送请求\n    服务器-->>用户：返回结果'},
{id:'fw-03',src:'gemini',code:'flowchart TD\n    A（开始）--> B（登录）\n    B --> C（主页）'},
{id:'fw-04',src:'chatgpt',code:'flowchart LR\n    A[用户] -->|点击，提交| B[系统]\n    B --> C[数据库]；'},
{id:'fw-05',src:'claude',code:'flowchart TD\n    A【需求分析】 --> B【设计】\n    B --> C【开发】'},
{id:'fw-06',src:'chatgpt',code:'flowchart TD\n    A[注册] --> B{是否成功？}\n    B -->|是| C[进入首页]\n    B -->|否| D[提示错误]\n    A → D'},
{id:'fw-07',src:'gemini',code:'sequenceDiagram\n    Alice->>Bob：Hello Bob，how are you？\n    Bob-->>Alice：Fine，thanks！'},
{id:'fw-08',src:'claude',code:'flowchart TD\n    A[“Start (now)”] --> B[“Next step”]'},
{id:'fw-09',src:'chatgpt',code:'flowchart LR\n    下单 → 支付 → 发货 → 收货'},

/* ---- 6. wrong flowchart arrows ---- */
{id:'arrow-01',src:'chatgpt',code:'flowchart TD\n    A -> B\n    B -> C'},
{id:'arrow-02',src:'claude',code:'flowchart LR\n    Client -> Gateway -> Service -> DB'},
{id:'arrow-03',src:'gemini',code:'graph TD\n    A[Input] -> B[Validate]\n    B -> C{OK?}\n    C -->|yes| D[Save]\n    C -->|no| A'},
{id:'arrow-04',src:'chatgpt',code:'flowchart TD\n    A => B\n    B => C'},
{id:'arrow-05',src:'claude',code:'flowchart TD\n    A - -> B\n    B --> C'},
{id:'arrow-06',src:'gemini',code:'flowchart LR\n    A ->> B\n    B ->> C'},
{id:'arrow-07',src:'chatgpt',code:'flowchart TD\n    A[Start] —> B[Middle]\n    B —> C[Stop]'},
{id:'arrow-08',src:'claude',code:'flowchart LR\n    A <-> B\n    B --> C'},
{id:'arrow-09',src:'gemini',code:'stateDiagram-v2\n    [*] -> Idle\n    Idle -> Running : start\n    Running -> [*]'},

/* ---- 7. broken edge labels ---- */
{id:'label-01',src:'chatgpt',code:'flowchart TD\n    A -->|label|> B'},
{id:'label-02',src:'claude',code:'flowchart TD\n    A{Valid?} -->|Yes|> B[Save]\n    A -->|No|> C[Reject]'},
{id:'label-03',src:'gemini',code:'flowchart LR\n    A -->|retry|--> B\n    B --> C'},
{id:'label-04',src:'chatgpt',code:'flowchart TD\n    A -->|step 1| --> B\n    B -->|step 2| --> C'},
{id:'label-05',src:'claude',code:'flowchart TD\n    A -> |yes| B\n    A -> |no| C'},
{id:'label-07',src:'gemini',code:'flowchart TD\n    A{OK?} -->|yes|  B[Next]\n    A -->|no|  C[Stop]'},
{id:'label-06',src:'chatgpt',code:'flowchart TD\n    A -->|Retry (max 3)| A\n    A -->|Give up| B'},

/* ---- 8. subgraph titles ---- */
{id:'sub-01',src:'chatgpt',code:'flowchart TD\n    subgraph Frontend (React)\n        A[UI] --> B[State]\n    end\n    B --> C[API]'},
{id:'sub-02',src:'claude',code:'flowchart LR\n    subgraph Data Layer (Postgres)\n        DB[(Main DB)]\n    end\n    App --> DB'},
{id:'sub-03',src:'gemini',code:'flowchart TD\n    subgraph ingest [Step 1 (raw files)]\n        A --> B\n    end\n    B --> C'},
{id:'sub-04',src:'chatgpt',code:'flowchart TD\n    subgraph svc [Services (internal)]\n        A --> B\n    end'},
{id:'sub-05',src:'claude',code:'flowchart TB\n    subgraph "Cloud" (AWS)\n        L[Lambda] --> S3[(S3)]\n    end'},

/* ---- 9. missing diagram type ---- */
{id:'hdr-01',src:'chatgpt',code:'A --> B\nB --> C\nC --> D'},
{id:'hdr-02',src:'claude',code:'    A[Start] --> B{Decision}\n    B -->|Yes| C[Do it]\n    B -->|No| D[Skip]'},
{id:'hdr-03',src:'gemini',code:'participant Browser\nparticipant API\nBrowser->>API: POST /items\nAPI-->>Browser: 201 Created'},
{id:'hdr-04',src:'chatgpt',code:'USER ||--o{ POST : writes\nPOST ||--|{ COMMENT : has'},
{id:'hdr-05',src:'claude',code:'Flowchart TD\n    A --> B'},
{id:'hdr-06',src:'gemini',code:'sequencediagram\n    A->>B: hi\n    B-->>A: hello'},
{id:'hdr-07',src:'chatgpt',code:'flowchart top-down\n    A --> B\n    B --> C'},
{id:'hdr-08',src:'claude',code:'[*] --> Idle\nIdle --> Running : start\nRunning --> [*] : stop'},
{id:'hdr-09',src:'chatgpt',code:'FlowChart LR\n    A --> B --> C'},

/* ---- 10. explanation text around the code ---- */
{id:'prose-01',src:'chatgpt',code:'Here is the diagram:\nflowchart TD\n    A --> B\n    B --> C'},
{id:'prose-02',src:'claude',code:'Sure! Here\'s a flowchart showing the login process:\n\nflowchart TD\n    A[Open app] --> B[Enter password]\n    B --> C{Correct?}\n    C -->|Yes| D[Home]\n    C -->|No| B\n\nThis diagram shows how the user is sent back when the password is wrong.'},
{id:'prose-03',src:'gemini',code:'Below is a sequence diagram for the checkout flow.\nsequenceDiagram\n    Customer->>Shop: Add to cart\n    Shop-->>Customer: Cart updated\nFeel free to adjust the participants.'},
{id:'prose-04',src:'chatgpt',code:'```mermaid\nflowchart LR\n    A --> B\n```\n\n**Explanation:**\n- A is the input\n- B is the output'},
{id:'prose-05',src:'claude',code:'I created the diagram below.\n\n```mermaid\ngraph TD\n    X --> Y\n```\n\nLet me know if you want more detail!'},
{id:'prose-06',src:'chatgpt',code:'### Architecture\nflowchart TD\n    Web --> API\n    API --> DB\n\nKey points:\n1. Web talks to API\n2. API owns the DB'},
{id:'prose-07',src:'gemini',code:'Certainly, here you go:\n\nerDiagram\n    AUTHOR ||--o{ BOOK : writes\n\nThe AUTHOR entity can write zero or more books.'},

/* ---- 11. graph keyword with flowchart-only syntax ---- */
{id:'graph-01',src:'chatgpt',code:'graph LR\n    A[Start]-->B[Step (1)]\n    B-->C[Step (2)]'},
{id:'graph-02',src:'claude',code:'graph LR\n    A@{ shape: rect } --> B'},
{id:'graph-03',src:'chatgpt',code:'flowchart TD\n    db@{ shape: cyl, label: "Orders DB" } --> api@{ shape: rounded, label: "API" }'},

/* ---- 12. invisible characters ---- */
{id:'inv-01',src:'chatgpt',code:'\u200Bflowchart TD\n    A --> B\n    B --> C'},
{id:'inv-02',src:'claude',code:'flowchart TD\n    A\u200B --> B\n    B --> C'},
{id:'inv-03',src:'gemini',code:'sequenceDiagram\n    Alice-\u200B>>Bob: Hi\n    Bob-->>Alice: Hey'},
{id:'inv-04',src:'chatgpt',code:'flowchart TD\n    A[Start] --\uFEFF> B[Stop]'},

/* ---- 13. multi-word node ids ---- */
{id:'ids-01',src:'chatgpt',code:'flowchart TD\n    User Login --> Dashboard\n    Dashboard --> Settings Page'},
{id:'ids-02',src:'claude',code:'flowchart LR\n    Order Placed --> Payment Received --> Order Shipped'},
{id:'ids-03',src:'gemini',code:'flowchart TD\n    Start Here --> Check Input{Valid?}\n    Check Input -->|yes| Save Data'},

/* ---- 14. unclosed blocks ---- */
{id:'open-01',src:'chatgpt',code:'flowchart TD\n    subgraph API\n        A --> B'},
{id:'open-02',src:'claude',code:'sequenceDiagram\n    loop Every minute\n        Client->>Server: ping\n        Server-->>Client: pong'},
{id:'open-03',src:'gemini',code:'sequenceDiagram\n    A->>B: request\n    alt success\n        B-->>A: data\n    else failure\n        B-->>A: error'},

/* ---- 15. ER relationship labels ---- */
{id:'er-01',src:'chatgpt',code:'erDiagram\n    CUSTOMER ||--o{ ORDER : places, cancels\n    ORDER ||--|{ LINE_ITEM : contains'},
{id:'er-02',src:'claude',code:'erDiagram\n    USER ||--o{ SESSION : has many\n    USER {\n        int id\n        string email\n    }'},
{id:'er-03',src:'gemini',code:'erDiagram\n    STUDENT }o--o{ COURSE : enrolls in (semester)'},

/* ---- 16. class diagram generics ---- */
{id:'class-01',src:'chatgpt',code:'sequenceDiagram\n    participant U as User\n    participant A as API\n    U->>A: login; then fetch profile\n    A-->>U: 200 OK'},
{id:'class-02',src:'claude',code:'sequenceDiagram\n    Client->>Server GET /health\n    Server-->>Client 200'},

/* ---- 17. pie labels ---- */
{id:'pie-01',src:'chatgpt',code:'pie title Browser share\n    Chrome : 65\n    Safari : 19\n    Edge : 5'},
{id:'pie-03',src:'claude',code:'pie title Time spent\n    "Coding" : 60%\n    "Meetings" : 25%\n    "Email" : 15%'},
{id:'pie-02',src:'gemini',code:'pie\n    title Budget\n    Rent : 40\n    Food : 25\n    Savings : 35'},

/* ---- 18. several problems at once (most realistic) ---- */
{id:'multi-01',src:'chatgpt',code:'Here is a flowchart of the process:\n\n```mermaid\ngraph TD\n    A[Start (user)] -> B{Logged in?}\n    B -->|Yes| C[Dashboard]\n    B -->|No| D[Login page]\n    D --> end\n```'},
{id:'multi-02',src:'claude',code:'```mermaid\nflowchart TD\n    A[开始（初始化）] → B{检查配置}\n    B -->|通过| C[运行]\n    B -->|失败| end\n```'},
{id:'multi-03',src:'gemini',code:'\uFEFFA[Fetch data (API)] --> B[Clean data]\nB --> C[Train model (GPU)]\nC --> end'},
{id:'multi-04',src:'chatgpt',code:'flowchart LR\n    subgraph Client Side\n        UI[React UI (SPA)] -> Store[Redux]\n    end\n    Store -->|fetch|> API[REST API]'},
{id:'multi-05',src:'claude',code:'Sure — here\'s the diagram.\n```mermaid\nflowchart TD\n    A["Click "Buy""] --> B[Payment (Stripe)]\n    B --> C{Paid?}\n    C -->|yes|> D[Ship]\n    C -->|no| end\n```\nHope this helps!'},
{id:'multi-06',src:'chatgpt',code:'graph TD\n    A[Receive order] → B[Check stock (warehouse)]\n    B → C{In stock?}\n    C -->|是| D[Ship]\n    C -->|否| E[Back-order]'},
{id:'multi-07',src:'gemini',code:'```mermaid\nsequenceDiagram\n    participant C as Client\n    participant S as Server\n    C->>S：login(user, pass)\n    S-->>C：token\n```'},
{id:'multi-08',src:'claude',code:'flowchart TD\n    subgraph Build Stage\n        A[Checkout code] -> B[Install (pnpm)]\n    end\n    subgraph Deploy Stage\n        C[Upload] -> D[Notify team]\n    end\n    B -> C'},
{id:'multi-09',src:'chatgpt',code:'The following diagram illustrates the onboarding flow:\nflowchart TD\n    Sign Up --> Verify Email\n    Verify Email --> Complete Profile\n    Complete Profile --> end'},
{id:'multi-10',src:'gemini',code:'```mermaid\nflowchart LR\n    A[Raw data] -->|clean (dropna)| B[Clean data]\n    B -->|train| C[Model [v1]]\n```'},
{id:'multi-11',src:'chatgpt',code:'flowchart TD\n    A[Request] --> B{Auth?}\n    B -- No --> C[401 (Unauthorized)]\n    B -- Yes --> D[Handler]\n    D --> E[Response (JSON)]'},
{id:'multi-12',src:'claude',code:'flowchart TD\n  A[Idea] --> B[Prototype (MVP)]\n  B --> C{Users like it?}\n  C -->|Yes| D[Scale]\n  C -->|No| A\n  D --> end((Done))'},
{id:'multi-13',src:'chatgpt',code:'graph LR\n    user[User] -> app[App (web)]\n    app -> api[API]\n    api -> db[(Postgres)]'},
{id:'multi-14',src:'gemini',code:'```mermaid\nerDiagram\n    CUSTOMER ||--o{ ORDER : places an order\n```\nEach customer can place many orders.'},
{id:'multi-15',src:'claude',code:'flowchart TD\n    A[Start] --> B[Read config (.env)]\n    B --> C{Has API key?}\n    C -->|No| D[Prompt user (CLI)]\n    C -->|Yes| E[Connect]\n    D --> E\n    E --> end'},
{id:'multi-16',src:'chatgpt',code:'flowchart TD\n    A[Upload CSV] --> B[Validate columns [id, name]]\n    B --> C{Errors?}\n    C -->|Yes|> D[Show report]\n    C -->|No|> E[Import]'},
{id:'multi-17',src:'gemini',code:'flowchart TD\n    A[“开始（初始化）”] → B[处理]\n    B → C[完成]'},
{id:'multi-18',src:'claude',code:'Here\'s the updated chart:\n\nflowchart LR\n    A[Plan] -> B[Do] -> C[Check] -> D[Act (adjust)]\n    D -> A'},
{id:'multi-19',src:'chatgpt',code:'flowchart TD\n    subgraph Phase 1 (Q1)\n        A[Research] --> B[Design]\n    end\n    subgraph Phase 2 (Q2)\n        C[Build] --> D[Launch]\n    end\n    B --> C\n    D --> end'},
{id:'multi-20',src:'gemini',code:'flowchart TD\n    A[输入: 用户名 (必填)] --> B{校验 (长度)}\n    B -->|合法| C[保存]'},

/* ---- 19. beyond rule-based repair (expected to fail) ---- */
{id:'hard-01',src:'chatgpt',hard:true,code:'flowchart TD\n    A -->|yes B\n    B --> C'},
{id:'hard-02',src:'claude',hard:true,code:'sequenceDiagram\n    A->>B: hi\n    deactivate B'},
{id:'hard-03',src:'gemini',hard:true,code:'flowchart TD\n    A[Start --> B'},
{id:'hard-04',src:'chatgpt',hard:true,code:'gantt\n    dateFormat YYYY-MM-DD\n    section Build\n    Task one 2026-01-01, 3d\n    Task two : 2026-01-04, 2d'},
{id:'hard-05',src:'claude',hard:true,code:'sequenceDiagram\n    A->>B: hi\n    end\n    B-->>A: bye'},
{id:'hard-06',src:'gemini',hard:true,code:'flowchart TD\n    A[Start] --> B[Process\n    B --> C'},
{id:'hard-07',src:'chatgpt',hard:true,code:'diagram flow\n    start: Begin\n    stop: Finish\n    start->stop'},
{id:'hard-08',src:'claude',hard:true,code:'classDiagram\n    Animal <|-- \n    class Dog'}
],
valid:[
{id:'ok-01',code:'flowchart TD\n    A[Start] --> B{Is it?}\n    B -->|Yes| C[OK]\n    C --> D[Rethink]\n    D --> B\n    B ---->|No| E[End]'},
{id:'ok-02',code:'sequenceDiagram\n    Alice->>John: Hello John, how are you?\n    John-->>Alice: Great!\n    Alice-)John: See you later!'},
{id:'ok-03',code:'classDiagram\n    Animal <|-- Duck\n    Animal : +int age\n    Animal: +isMammal()\n    class Duck{\n        +String beakColor\n        +swim()\n    }'},
{id:'ok-04',code:'stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Crash\n    Crash --> [*]'},
{id:'ok-05',code:'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses'},
{id:'ok-06',code:'gantt\n    title A Gantt Diagram\n    dateFormat YYYY-MM-DD\n    section Section\n        A task :a1, 2026-01-01, 30d\n        Another task :after a1, 20d'},
{id:'ok-07',code:'pie title Pets adopted\n    "Dogs" : 386\n    "Cats" : 85\n    "Rats" : 15'},
{id:'ok-08',code:'flowchart LR\n    A["Start (init)"] --> B("Round [x]")\n    B --> C{{"Hex {y}"}}\n    C -.-> D[(Database)]\n    D ==> E((Circle))'},
{id:'ok-09',code:'graph TD\n    subgraph one\n        a1-->a2\n    end\n    subgraph two\n        b1-->b2\n    end\n    one --> two'},
{id:'ok-10',code:'journey\n    title My working day\n    section Go to work\n        Make tea: 5: Me\n        Go upstairs: 3: Me'},
{id:'ok-11',code:'flowchart TD\n    开始[开始] --> 处理[处理数据]\n    处理 --> 结束[结束]'},
{id:'ok-12',code:'gitGraph\n    commit\n    branch develop\n    checkout develop\n    commit\n    checkout main\n    merge develop'},
{id:'ok-13',code:'mindmap\n  root((mindmap))\n    Origins\n      Long history\n    Research\n      On effectiveness'},
{id:'ok-14',code:'timeline\n    title History\n    2002 : LinkedIn\n    2004 : Facebook\n         : Google'},
{id:'ok-15',code:'flowchart TD\n    A --> B\n    click A "https://example.com" "Tooltip"\n    style B fill:#f9f,stroke:#333\n    classDef green fill:#9f6\n    class A green'}
]};
