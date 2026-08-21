# Rà soát trước khi dịch — 1-Click-MVU / 小玉藻写卡器 1.0

Tài liệu này **chỉ dừng ở bước kiểm tra và xác định**. Chưa dịch bất kỳ chuỗi nào.
Mục tiêu: chốt danh sách chỗ được dịch, chỗ bị khóa (biến / ID / tag giao thức), và các
cặp chuỗi phải đổi cùng lúc, trước khi bắt tay vào bản dịch.

- File nguồn đã format: `src/index.formatted.js` (prettier, printWidth 120, parser babel)
- Bảng kê chuỗi đầy đủ: `docs/i18n-inventory.tsv` (883 dòng, có số dòng + phân loại + hành động)
- Mọi số dòng trong tài liệu này trỏ tới `src/index.formatted.js`

---

## 1. File này là gì

Bundle webpack đã minify (1 dòng, 4.58 MB) của một extension SillyTavern viết bằng **Vue 3 + Pinia**,
tên nội bộ `小玉藻写卡器1.0` (Tamamo Card Writer). Nó tự động sinh **thẻ nhân vật + world book +
regex script + status bar MVU** từ vài câu mô tả của người dùng.

Sau khi format: **7.487 dòng**, gồm 5 module webpack.

| Vùng | Dòng | Nội dung |
|---|---|---|
| Module 650 / 323 | 3–50 | 2 file CSS inject (`tamamo-app.css`, `writer-base.css`) |
| Module 698 / 882 | 51–111 | runtime của `css-loader` |
| Module 705 | 112–7487 | Toàn bộ ứng dụng |
| ├─ 16 component Vue | 112–3583 | render function + `setup()` đã biên dịch |
| ├─ Tích hợp SillyTavern + MVU | 3584–4242 | world book, schema biến, status bar, thẻ nhân vật |
| ├─ Preset prompt (JSON) | 4243–4245 | **209 KB** prompt manager, 1 chuỗi duy nhất |
| ├─ Pipeline sinh nội dung | 4246–4990 | knowledge, chưng cất, blacklist, retry |
| ├─ Kiểm tra / sửa định dạng | 4991–5307 | parse tag output, cài regex script |
| └─ `App.vue` (root) | 5308–7487 | state, orchestration, toàn bộ toastr/log |

Hai dòng "khủng" là **asset chứ không phải code**: dòng 5370 là ảnh WebP base64 3,8 MB,
dòng 4244 là preset JSON 325 KB. Code thật chỉ khoảng 500 KB.

**Cảnh báo trước:** đây là bundle đã minify, **không có source map** (`index.js.map` được tham chiếu
nhưng không kèm theo). Tên biến đã bị rút gọn (`n`, `e`, `t`, `pr`, `wo`, `$n`…). Dịch trực tiếp trên
bundle là khả thi nhưng mọi thay đổi sẽ mất khi build lại. **Nếu có source gốc (`src/小玉藻写卡器1.0/`),
nên dịch trên source, không dịch trên bundle này.**

### 16 component Vue

`AppHeader`(123) · `AppSidebar`(257) · `BeginnerWorkspace`(449) · `CompletionView`(799) ·
`ContinuationDialog`(956) · `CreateCharacterDialog`(1035) · `FormatReviewDialog`(1189) ·
`OpeningWorkspace`(1441) · `PersonaView`(1738) · `PreflightDialog`(1936) · `RestoreConfirmDialog`(2141) ·
`SetupView`(2274) · `WorkView`(2685) · `RoleDraftCard`(3011) · `WriterWorkspace`(3237) · `App`(5308)

---

## 2. Khối lượng

Tổng cộng **883 chuỗi chứa chữ Hán** (đã phân tích bằng AST @babel/parser, không phải grep).

| Nhóm | Số chuỗi | Số ký tự | Hành động |
|---|---:|---:|---|
| **Cần dịch** (UI, toastr, log, lỗi runtime) | 610 | ~8.400 | Dịch |
| **Khóa** (biến MVU, tag, prefix, script name) | 75 | ~2.100 | Giữ nguyên |
| **Phải đổi cùng lúc** (sentinel so sánh `===`) | 8 | 47 | Đổi đồng bộ hoặc không đổi |
| **Cẩn thận** (tên file, tên script ST) | 3 | 22 | Cân nhắc |
| **Quyết định riêng** (prompt gửi cho LLM) | 185 | ~4.900 | Xem mục 5 |
| **Preset JSON** (dòng 4244) | 1 | ~209.000 | Xem mục 5 |

Ước lượng: phần UI thuần (~8.400 ký tự Hán) khi dịch sang tiếng Việt sẽ **dài gấp ~2,5–3 lần**
về số ký tự. Đây là nguyên nhân của toàn bộ mục 6.

---

## 3. ⛔ DANH SÁCH KHÓA — tuyệt đối không dịch

### 3.1 Tên biến MVU (`stat_data`)

Đây là phần "đồng biến" quan trọng nhất. Bốn tên biến tiếng Trung — `世界`, `当前时间`,
`当前地点`, `好感度` — xuất hiện ở **6 nơi khác nhau** và phải khớp nhau tuyệt đối, nếu không
MVU sẽ không đọc được biến và status bar sẽ trống:

| Dòng | Nơi xuất hiện | Vai trò |
|---|---|---|
| 3636–3643 | Schema `z.object({ 世界: { 当前时间, 当前地点 }, 好感度 })` | Định nghĩa schema `[initvar]` |
| 3654–3657 | YAML giá trị khởi tạo (`当前时间: 开局`) | Giá trị mặc định |
| 3663–3680 | `变量更新规则` gửi cho LLM | Luật LLM phải tuân theo khi ghi biến |
| 3685 | `` `stat_data.${tên}.好感度` `` trong EJS `getvar(...)` | Đọc biến theo giai đoạn |
| 3714 | `affectionPath` cho status bar | Đọc biến để vẽ thanh thiện cảm |
| 3835–3836 | `_.get(variables, "stat_data.世界.当前时间", "开局")` | Script status bar đã inject |

Kèm theo: **giá trị mặc định** `开局` (3637, 3655, 3872) và `待定` (3638, 3656, 3873) cũng phải khớp
giữa `prefault` trong schema và fallback trong script status bar.

→ **Khuyến nghị: giữ nguyên tên biến tiếng Trung.** Nếu vẫn muốn Việt hóa (`好感度` → `thiện_cảm`),
phải sửa đủ 6 chỗ **trong cùng một commit**, và thẻ cũ đã tạo bằng bản trước sẽ **hỏng** (biến trong
chat cũ vẫn mang tên tiếng Trung, JSONPatch từ LLM sẽ trỏ vào path không tồn tại).

### 3.2 Prefix / tag của framework MVU

| Dòng | Chuỗi | Lý do |
|---|---|---|
| 3936 | `[initvar]变量初始化勿开` | MVU nhận diện entry khởi tạo biến qua prefix `[initvar]` |
| 3954, 3960, 3994 | `[mvu_update]...` | prefix `[mvu_update]` do MVU quét |
| 3944–3947 | `{{format_message_variable::stat_data}}`, `<status_current_variable>` | macro ST + tag MVU |
| 3966–3990 | `<UpdateVariable>`, `<Analysis>`, `<JSONPatch>` | giao thức JSONPatch của MVU |
| 5254, 5270 | `find_regex: "/<StatusPlaceHolderImpl\\/>/g"` | placeholder MVU chèn vào output |

Phần chữ Hán **sau** prefix (`变量初始化勿开`, `变量列表`…) là tên hiển thị trong world book — xem 3.4.

### 3.3 `script_name` của regex script — nguy cơ nhân đôi

Dòng **5285–5286**:

```js
const o = new Set(a.map((n) => n.script_name)),
  i = (n) => [...n.filter((n) => !o.has(n.script_name)), ...a];
```

Regex script được **dedupe theo `script_name`**, không theo `id`. Nếu dịch `script_name`:

| Dòng | `script_name` |
|---|---|
| 5247 | `一键生卡_隐藏状态栏标记` |
| 5262 | `一键生卡_MVU状态栏` |
| 5227, 5232, 5237, 5242 | `仅格式思维链`, `只发送最新2楼的变量更新`, `[美化]变量完成-三明月喵`, `[美化]变量更新中-三明月喵` |

→ Người dùng đã cài bản cũ sẽ có **cả script cũ lẫn script mới cùng chạy**: status bar hiện 2 lần,
regex chạy chồng. **Giữ nguyên `script_name`**, hoặc phải viết code dọn dẹp theo tên cũ.

Bốn script ở 5227–5242 còn có `id` UUID cố định (`d668c8a6-…`, `5bb4b588-…`) — không đụng vào.
Tương tự dòng **6389**: JSON script `{"name":"MVU","id":"961f366d-e403-45c2-8155-3d14ec86de53"}` — khóa.

### 3.4 Tên entry world book — tùy đường ghi

Dòng **5289–5303**:

```js
async function ii(n) { /* xóa MỌI entry có extra.source === "one-click-card-writer" */ }
async function Ai(n, e) { /* chỉ xóa entry trùng TÊN rồi ghi đè */ }
async function si(n, e) { await ii(n); await Ai(n, e); }
```

- Đường "ghi toàn bộ" (`si`, dòng 5302) xóa sạch theo `extra.source` → **đổi tên an toàn**.
- Đường ghi từng phần (`Ai` ở 5856, 6338, 6374, 6379 — ghi lại riêng thế giới quan / từng nhân vật /
  khối biến) chỉ khớp theo **`name`** → đổi tên sẽ **để lại entry cũ mồ côi**, world book phình đôi.

Tên entry liên quan: `世界观`(3891), `角色速览`(3901), `变量列表`(3943), `${tên}_基础信息`(3915),
`${tên}_性格调色盘`(3916), `${tên}_二次解释`(3918), `${tên}_EJS调色盘多阶段人设`(3930), và bộ
`[initvar]`/`[mvu_update]` ở 3936–3994.

Ngoài ra dòng **3892, 3902, 3915–3930** còn sinh **tag XML lồng trong nội dung entry**
(`<世界观_id1>`, `<角色速览_id0>`, `<Tên_基础信息_id2>`…). Các tag này đi vào prompt cho LLM;
đổi tên = đổi cấu trúc prompt.

Dòng **3911**: fallback `"角色"` khi tên nhân vật bị sanitize hết ký tự
(`.replace(/[^\p{L}\p{N}_-]/gu, "_")`). Tiếng Việt có dấu lọt qua `\p{L}` nên không sao,
nhưng đừng đổi giá trị fallback nếu không đổi luôn quy ước tag.

### 3.5 Blacklist "từ công trình" — chỉ dịch `label`, không dịch `pattern`

Dòng **4393–4409**: mảng `co` kiểm tra output của LLM và **bắt sinh lại** nếu dính:

```js
{ label: "待补充",   pattern: /待补充/u },
{ label: "工程占位词", pattern: /模板|提示词|工程词|占位符|placeholder/iu },
{ label: "前端流程词", pattern: /前端会|工具会|生成器|代码会/u },
```

`label` chỉ để hiện trong thông báo lỗi (4732, 4570) → **dịch được**.
`pattern` khớp với **output tiếng Trung của LLM** → **dịch là hỏng bộ lọc**.
Nếu sau này chuyển prompt sang tiếng Việt thì phải viết lại `pattern` cho tiếng Việt (mục 5).

### 3.6 Tag output & alias — đã là tiếng Anh, giữ nguyên

Dòng 4993–5044 (`To`, `Lo`): `worldview_result`, `role_result`, `basic`, `palette`, `reinterpret`,
`multistage_persona`, `stage_early/middle/close/common`, `quick_view`, `content`, `thinking`.
Toàn bộ đã là tiếng Anh và được `Io()` (5081) dùng để kiểm tra thiếu tag / chưa đóng tag. Không đụng.

### 3.7 Khóa lưu trữ

| Dòng | Khóa | Ghi chú |
|---|---|---|
| 5623 | `` `tamamo-card-writer:draft:v1:${tênThẻ}` `` (localStorage) | đổi = mất draft của người dùng cũ |
| 4209 | IndexedDB `one-click-card-writer` | |
| 3584 | `ir = "one-click-card-writer"` → `extra.source` của entry | dùng để dọn world book (3.4) |
| 5692, 5736 | tên file `已缓存卡面.png` | upload lên ST; đổi được nhưng không cần thiết |

---

## 4. ⚠️ CÁC CẶP PHẢI ĐỔI CÙNG LÚC (sentinel)

Đây là các chuỗi tiếng Trung **vừa hiển thị vừa dùng để so sánh logic**. Dịch một chỗ mà quên
chỗ kia là app hỏng âm thầm, không báo lỗi.

### 4.1 `未打开角色卡` — 3 chỗ

```js
5326: i = ref(o && !Pr(o) ? o : "未打开角色卡")      // giá trị mặc định của tên thẻ
5387: const ln = computed(() => "未打开角色卡" !== i.value && !Pr(i.value))   // gate cho phép chạy
5418: "未打开角色卡" !== i.value && (n += 15)                                  // tính % tiến độ
```

Dịch dòng 5326 mà quên 5387 → nút "bắt đầu" **không bao giờ bật**.

### 4.2 Tên world book mặc định — dòng 5327

```js
A = ref("未打开角色卡" === i.value ? "一键角色卡世界书" : `${i.value}世界书`)
```

Hậu tố `世界书` được ghép vào tên thẻ để tạo tên world book. Đổi thành `Sách thế giới` →
với thẻ **đã tạo bằng bản cũ**, app sẽ trỏ vào world book không tồn tại và tạo world book mới rỗng.
→ Nếu đổi, cần code dò cả tên cũ lẫn tên mới.

### 4.3 `新角色` — dòng 5939 / 5941

```js
5939: e.has("新角色")            // Set các tên đã dùng
5941: `新角色 ${n}`              // sinh tên "新角色 2", "新角色 3"...
```

Đổi một trong hai → chống trùng tên hỏng, sinh ra nhiều nhân vật cùng tên.

### 4.4 Nhãn status bar — dòng 3774 / 3828

`svg.setAttribute("aria-label", "好感度")` và `foot.textContent = "好感度"` là **chữ hiển thị**
(dịch được), nhưng nằm ngay cạnh `stat_data...好感度` ở 3835 là **tên biến** (khóa).
Rất dễ dịch nhầm cả cụm bằng find-and-replace. **Không dùng replace-all cho `好感度`.**

### 4.5 Các cụm bị nối chuỗi

| Dòng | Mẫu | Rủi ro |
|---|---|---|
| 4570, 4732 | `` `${nhãn}包含工程词或占位内容：${label}（${match}）` `` | ghép 3 mảnh, dịch phải giữ thứ tự placeholder |
| 5817 | `` `${n}：${e}` `` | dấu `：` toàn giác — nên đổi thành `: ` cho tiếng Việt |
| 5821 | `` `${n}存在标签或内容提醒，已继续生成` `` | chủ ngữ đứng trước, tiếng Việt phải đảo |
| 4577 | `` `已用「${e.join("、")}」…` `` | `、` là dấu liệt kê tiếng Trung → tiếng Việt dùng `, ` |
| 4723 | `--- 分段边界 ---` | **không phải UI** — là dấu phân đoạn khi split/join văn bản gửi LLM. Khóa. |

---

## 5. 🟡 QUYẾT ĐỊNH LỚN CẦN CHỐT TRƯỚC: dịch UI hay dịch cả prompt?

Đây là câu hỏi phải trả lời **trước khi dịch dòng đầu tiên**, vì hai hướng có khối lượng chênh nhau
khoảng 25 lần.

### Hướng A — Chỉ Việt hóa giao diện (khuyến nghị)

Dịch 610 chuỗi UI (~8.400 ký tự). Prompt, biến, tag giữ nguyên tiếng Trung.
**Kết quả: giao diện tiếng Việt, thẻ nhân vật sinh ra vẫn bằng tiếng Trung.**

- Rủi ro kỹ thuật: thấp. Không đụng bộ lọc, không đụng biến, không vỡ thẻ cũ.
- Thời gian: ngắn.
- Nhược điểm: người dùng Việt gõ mô tả tiếng Việt nhưng nhận về thẻ tiếng Trung.

### Hướng B — Việt hóa cả nội dung sinh ra

Phải dịch thêm:

1. **Preset JSON dòng 4244** — 209 KB, khoảng 20 prompt block (`一键角色卡扩写知识`,
   `输出格式要求`, `思维链自检`…). Có `identifier` cho từng prompt (`_r = new Map(Mr.prompts.map(...))`
   dòng 4247) — **`identifier` là khóa, chỉ dịch `content`**.
2. **Knowledge builder 4343–4990** — 184 chuỗi, ~4.900 ký tự, gồm luật viết thẻ, luật EJS
   nhiều giai đoạn, luật chưng cất.
3. **Lệnh ép ngôn ngữ output**: các prompt hiện ghi rõ `使用紧凑中文 YAML` (4755, 4788, 4821, 4873, 4932) và
   `压缩到约 12000 汉字以内` ("nén xuống dưới 12.000 **chữ Hán**"). Ngưỡng đếm này **vô nghĩa với
   tiếng Việt** — 12.000 ký tự tiếng Việt ít thông tin hơn nhiều so với 12.000 chữ Hán. Phải tính lại,
   không dịch máy móc.
4. **Blacklist `pattern`** (3.5) phải viết lại toàn bộ cho tiếng Việt, nếu không bộ chống-placeholder
   sẽ không bao giờ khớp và mất tác dụng.
5. **`变量更新规则`** (3663–3680) — nếu LLM trả lời tiếng Việt nhưng luật vẫn tiếng Trung thì vẫn chạy,
   nhưng nên dịch để nhất quán. Lưu ý: tên biến trong luật **vẫn phải là tên biến gốc** (3.1).
6. Dòng **4305** là câu "assistant prefill" (`好的，我都理解了…`) — đổi ngôn ngữ ở đây ảnh hưởng trực tiếp
   ngôn ngữ output của LLM.
7. Dòng **3720** `<html lang="zh-CN">` trong status bar → `lang="vi"`.

→ Hướng B là **một dự án riêng**, cần test sinh thẻ thật nhiều lần. Không nên gộp vào cùng PR với UI.

**Đề xuất: làm Hướng A trước, đo phản hồi, rồi mới cân nhắc Hướng B.**

---

## 6. 🎨 VẤN ĐỀ HIỂN THỊ — tiếng Việt sẽ tràn layout

Đây là rủi ro bị bỏ sót nhiều nhất. CSS được viết cho tiếng Trung, nơi 1 ký tự = 1 từ.

Thống kê trên 2 file CSS (dòng 10–50):

| Vấn đề | Số lần | Hậu quả với tiếng Việt |
|---|---:|---|
| `white-space: nowrap` | 42 | chữ dài không xuống dòng → **tràn ra ngoài** |
| `text-overflow: ellipsis` | 28 | nhãn bị cắt thành `Tạo nhân v…` |
| `font-size` ≤ 10px | 194 | dấu thanh (`ế`, `ộ`, `ữ`) mờ, khó đọc |
| `height: NNpx` cố định | 130 | chữ xuống 2 dòng bị **cắt mất dòng dưới** |
| `line-height` < 1.4 | 14 | **dấu mũ + dấu thanh chồng nhau** (`ế`, `ồ`, `ỗ`) |
| `letter-spacing` | 28 | `letter-spacing` dương làm chữ Latin rời rạc |
| `grid-template-columns` cố định | 202 | cột hẹp không đủ chỗ |

### 6.1 Font — vấn đề nghiêm trọng nhất

```css
/* dòng 34 */ font-family: 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei UI', sans-serif;
/*         */ font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif;
/*         */ font-family: 'Sarasa Mono SC', 'Microsoft YaHei UI', monospace;
/* dòng 3725 (status bar) */ font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
```

Toàn bộ font stack **ưu tiên font Trung giản thể**. Các font `SC` này **không phủ đủ ký tự tiền kết hợp
tiếng Việt** (`ế ệ ộ ữ ự ằ ẵ`…). Trình duyệt sẽ fallback từng ký tự → chữ trong cùng một từ **cao thấp
lệch nhau**, hoặc hiện ô vuông.

→ **Bắt buộc:** thêm font hỗ trợ Việt lên **đầu** stack, ví dụ:
```css
font-family: 'Be Vietnam Pro', 'Inter', 'Noto Sans', 'Noto Sans SC', sans-serif;
```
(Giữ `Noto Sans SC` ở cuối vì phần prompt/preview vẫn hiện chữ Hán.)

### 6.2 Các chỗ cụ thể cần đo lại sau khi dịch

| Dòng | Thành phần | Ràng buộc |
|---|---|---|
| 117, 152, 158 | `AppHeader` — `当前角色`, `世界书` | `.context-label` + `nowrap` |
| 280–382 | `AppSidebar` — 5 mục điều hướng, mỗi mục `<strong>` + `<small>` | `小` = 2 chữ → `"Chỉ tạo hồ sơ nhân vật"` = 24 ký tự |
| 194 | badge `格式已通过` / `` `格式提醒 ${n}` `` | badge `border-radius: 999px` + `nowrap` |
| 632 | `<span class="optional-badge">可跳过</span>` | badge nhỏ, `"Có thể bỏ qua"` dài gấp 4 |
| 475 | 5 chip: `温柔陪伴`, `欢喜冤家`, `危险拉扯`, `冒险搭档`, `慢热治愈` | grid chip cố định, mỗi chip 4 ký tự |
| 4598–4601 | `初识期 0~30` / `熟悉期 31~70` / `亲近期 71~100` / `跨阶段通用` | nhãn giai đoạn |
| 4637–4639, 4676–4682 | `初识期多阶段人设`… | **vừa là nhãn vừa là tên entry world book** — xem 3.4 |
| 535, 564, 613 | 3 `placeholder` textarea (mỗi cái ~25 chữ Hán) | placeholder dài sẽ bị cắt trên mobile |

### 6.3 Dấu câu toàn giác

Toàn bộ chuỗi UI dùng dấu toàn giác Trung: `，` `。` `：` `（）` `、` `“”` `？`.
Khi dịch **phải đổi sang dấu Latin** (`, . : ( ) " ?`) — dấu toàn giác chiếm chiều rộng gấp đôi
và trông sai trong câu tiếng Việt. Đặc biệt chú ý dòng 5817 (`${n}：${e}`) và 4577 (`、`).

---

## 7. Ghi chú kỹ thuật khác

1. **Không có sourcemap.** Nếu chỉ có bundle này, nên dịch bằng script thay vì sửa tay, và giữ lại
   file map `dòng → chuỗi gốc → chuỗi dịch` để lần sau build lại còn áp dụng lại được.
   `docs/i18n-inventory.tsv` chính là điểm khởi đầu cho map đó.
2. **Không có hệ thống i18n.** Chuỗi nằm hardcode trong render function. Muốn làm song ngữ
   (Trung/Việt) thì phải thêm lớp i18n — việc này nên làm trên source gốc, không làm trên bundle.
3. **Không dùng find-and-replace toàn cục** cho bất kỳ từ nào trong mục 3 và 4. Nhất là
   `好感度`, `世界书`, `角色`, `未打开角色卡`, `新角色`.
4. **Kiểm tra sau khi dịch:** app dùng `Io()` (dòng 5081) để tự kiểm tra định dạng output.
   Nếu vô tình dịch trúng tên tag, hàm này sẽ báo `缺少 <...> 结构` liên tục và app kẹt ở vòng retry.
5. Dòng 5370 là ảnh WebP base64 3,8 MB — đừng để prettier/editor đụng vào, và đừng diff nó.

---

## 8. Việc tiếp theo cần bạn chốt

1. **Hướng A hay Hướng B?** (mục 5) — quyết định này chi phối mọi thứ còn lại.
2. **Có source gốc không?** Nếu có thì dịch trên source, bundle này chỉ dùng để đối chiếu.
3. **Có phải giữ tương thích với thẻ đã tạo bằng bản cũ không?**
   - Nếu **có** → khóa toàn bộ mục 3 và mục 4, chỉ dịch UI thuần.
   - Nếu **không** → có thể Việt hóa cả tên entry world book và tên biến, nhưng phải làm trọn gói.
4. **Chọn font tiếng Việt** cho mục 6.1.

Sau khi chốt, bước tiếp theo là dựng **bảng thuật ngữ (glossary)** cho các từ lặp lại nhiều nhất
(`角色卡`, `世界书`, `开场白`, `人设`, `调色盘`, `写卡器`, `素材`, `蒸馏`, `阶段`) để bản dịch nhất quán
giữa 16 component.
