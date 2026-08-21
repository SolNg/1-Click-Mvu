# Kế hoạch Việt hóa — đã chốt hướng B

Cập nhật sau khi bạn chốt: **Việt hóa cả giao diện lẫn nội dung AI sinh ra**,
không cần tương thích thẻ cũ, giữ nguyên khung MVU/zod/YAML.

Tài liệu này bổ sung cho `docs/i18n-review.md` (bản rà soát gốc). Chỗ nào khác nhau thì
**tài liệu này thắng**.

---

## 1. Trả lời câu hỏi "có dẫn thêm đường nào không"

Có. Tổng cộng **13 URL ngoài**. Chia làm 3 loại:

### 1.1 Phụ thuộc runtime — app/thẻ không chạy được nếu mất mạng hoặc bị chặn

| Dòng | URL | Vai trò |
|---|---|---|
| **1** | `testingcf.jsdelivr.net/npm/pinia/+esm` | **Pinia load từ CDN lúc chạy.** Mất mạng = app trắng màn hình |
| 3633 | `…/StageDog/tavern_resource/dist/util/mvu_zod.js` | `registerMvuSchema` — nhúng vào script `变量结构` của thẻ |
| 6389 | `…/MagicalAstrogy/MagVarUpdate/artifact/bundle.js` | Chính là framework MVU, cài vào thẻ |
| 4244 (preset) | `…/tavern_resource/dist/预设/明月秋青写卡/脚本/index.js` | script kèm preset |
| 4244 (preset) | `cdn.jsdelivr.net/gh/MagicalAstrogy/LorebookToolCall/dist/wtc/index.js` | tool call world book |
| 5237, 5242 | `i.postimg.cc/DwFQBGk9/ezgif-201bf4672c1b72.gif` | **Ảnh GIF hiện trong khung chat** khi biến đang cập nhật |

⚠️ **Các URL này chứa đoạn đường dẫn tiếng Trung** (`dist/预设/明月秋青写卡/脚本/`).
Đây là đường dẫn thật trên CDN — **dịch là 404**. Đã đánh dấu trong inventory.

⚠️ `testingcf.jsdelivr.net` là mirror Cloudflare của jsDelivr (tác giả dùng vì TQ hay chặn jsdelivr).
Ở VN thì cả hai đều chạy, không cần đổi. Nhưng nếu muốn ổn định hơn có thể đổi sang
`cdn.jsdelivr.net` — **cùng nội dung, cùng path**.

⚠️ Ảnh GIF ở `i.postimg.cc` là host ảnh miễn phí — có thể chết bất cứ lúc nào. Nếu muốn chắc,
tự host lại. Không liên quan đến dịch.

### 1.2 Link tài liệu — chỉ là text trong prompt, không fetch

`stagedog.github.io/络络/教程/手写mvu变量卡/状态栏/` · `github.com/StageDog/tavern_helper_template/…/mvu变量框架.mdc` ·
`n0vi028.github.io/JS-Slash-Runner-Doc/guide/功能详情/请求生成.html`

Nằm trong prompt `📋 前端美化` — mà prompt này **không bao giờ được gửi** (xem §2). Bỏ qua.

### 1.3 Link UI

Dòng **3406, 3415**: 2 link Discord trong giao diện. Text quanh nó dịch được, URL giữ nguyên.

---

## 2. 🎉 Phát hiện lớn: preset 209 KB chỉ dùng ~17 KB

Preset ở dòng 4244 có **58 prompt**. Nhưng code lọc rất mạnh:

```js
4246: Or = new Set(Array.from({ length: 29 }, (_, n) => String(n + 12)));  // id "12".."40"
4505: if (Or.has(t)) { …thay bằng <task_scope>/<task_reference>…; continue; }
```

- **29 prompt (id 12–40) bị bỏ qua hoàn toàn**, thay bằng khối `<task_scope>` + `<task_reference>`
  do chính app dựng.
- **6 prompt nữa (id 41, 42, 43, 44, 45, 48) bị code ghi đè** — hàm `no()` dòng 4255–4310 trả về
  chuỗi hardcode trong code, **bỏ qua content trong JSON**.
- **1 prompt (id 49 `SPreset配置`, 9.908 ký tự) không có trong `prompt_order`** → chết hẳn.
- 2 prompt bị `enabled: false` (`main`, `11`).

### Kết quả

| Nhóm | Ký tự | Cần dịch? |
|---|---:|---|
| 12 prompt thật sự gửi mỗi lượt (id 1–10, 46, 47) | 5.019 | ✅ |
| 3 khối knowledge đọc qua `$r()` (id 13, 39, 24) | 12.159 | ✅ |
| **Tổng preset cần dịch** | **17.178** | |
| Prompt chết (không bao giờ gửi) | 95.781 | ❌ **bỏ qua** |

`$r()` (dòng 4248) đọc thẳng `content` theo identifier, **kệ cờ `enabled`** — nên id 13/39/24 tuy
`enabled: false` vẫn được dùng làm knowledge:
```js
4389: Ao = ["13", "39"];   // dùng cho tác vụ Thế giới quan
4390: so = ["24", "39"];   // dùng cho tác vụ Lời mở đầu
```

→ **Đừng dịch cả 209 KB.** Dịch đúng 15 prompt trên là đủ.

---

## 3. Khối lượng thật của hướng B

| Phần | Ký tự Hán | Ghi chú |
|---|---:|---|
| Giao diện (610 chuỗi) | ~8.400 | |
| Preset JSON (15 prompt) | 17.178 | §2 |
| Prompt/knowledge trong code (4246–4990) | 4.838 | gồm `io` 调色盘执行版, hướng dẫn từng tác vụ |
| MVU / world book / status bar / lỗi (3629–4242) | 1.621 | phần chữ hiển thị + luật gửi LLM |
| **TỔNG** | **~32.000** | |

Trước đây tôi ước tính 209 KB — **sai vì chưa trace luồng lọc prompt**. Con số đúng là ~32.000 ký tự.

---

## 4. ⛔ Danh sách khóa (đã cập nhật theo quyết định của bạn)

Vì **không cần tương thích thẻ cũ**, các mục sau **được mở khóa** so với bản rà soát trước:

| Trước | Giờ | Lý do |
|---|---|---|
| Tên entry world book (`世界观`, `角色速览`…) | ✅ **dịch được** | không cần khớp thẻ cũ |
| `script_name` regex script | ✅ **dịch được** | chấp nhận thẻ cũ có script mồ côi |
| Hậu tố tên world book `${tên}世界书` | ✅ **dịch được** | |
| Khóa localStorage `tamamo-card-writer:draft:v1:` | ✅ đổi được | chấp nhận mất draft cũ |
| Tên biến MVU `世界/当前时间/当前地点/好感度` | ✅ **dịch được** | xem §5 — đây là chỗ bạn hiểu chưa đúng |

**Vẫn khóa tuyệt đối:**

1. Prefix `[initvar]` / `[mvu_update]` — MVU quét theo prefix.
2. Tag giao thức: `<UpdateVariable>`, `<Analysis>`, `<JSONPatch>`, `<status_current_variable>`,
   `<StatusPlaceHolderImpl/>`, macro `{{format_message_variable::stat_data}}`, `{{user}}`,
   `{{lastUserMessage}}`, `{{trim}}`, `{{addvar::…}}`.
3. Tên gốc `stat_data` — MVU hardcode.
4. Tag output nội bộ (`worldview_result`, `role_result`, `basic`, `palette`, `stage_early`…) — đã là
   tiếng Anh, dòng 4993–5044.
5. Cú pháp zod / EJS / YAML — `z.object`, `z.string()`, `prefault`, `<%_ _%>`, `|-`.
6. Đoạn đường dẫn tiếng Trung trong URL CDN (§1.1).
7. `--- 分段边界 ---` (dòng 4723) — token phân đoạn nội bộ.
8. UUID của 4 regex script và script MVU.

---

## 5. ⚠️ Đính chính: tên biến trong zod schema KHÔNG phải yêu cầu của SillyTavern

Bạn nói *"zod schema hay yaml thường là yêu cầu mặc định bắt buộc của sillytavern nên cứ giữ nguyên"*.
Chính xác một nửa:

- **Bắt buộc:** cú pháp zod, hàm `registerMvuSchema`, cấu trúc YAML, đường gốc `stat_data`,
  giao thức JSONPatch. → giữ nguyên, đúng.
- **KHÔNG bắt buộc:** *tên field* bên trong. `世界`, `当前时间`, `当前地点`, `好感度` là do
  **tác giả preset tự đặt**, MVU không quan tâm chúng tên gì.

Điều này quan trọng với hướng B, vì:

> Nếu prompt là tiếng Việt nhưng tên biến vẫn tiếng Trung, bạn đang bắt LLM viết
> `{"op":"delta","path":"/好感度","value":1}` trong khi toàn bộ ngữ cảnh còn lại là tiếng Việt.
> Nó vẫn chạy, nhưng tỉ lệ LLM viết sai path sẽ tăng, và thanh trạng thái hiện nhãn tiếng Trung.

**Đề xuất: Việt hóa luôn tên biến** (vì không cần tương thích thẻ cũ). Đổi đủ 6 chỗ:

| Dòng | Nội dung |
|---|---|
| 3636–3643 | schema zod |
| 3654–3657 | YAML giá trị khởi tạo |
| 3663–3680 | luật cập nhật gửi LLM |
| 3685 | `` `stat_data.${tên}.好感度` `` trong EJS |
| 3714 | `affectionPath` |
| 3835–3836 | `_.get(variables, "stat_data.世界.当前时间", …)` |

Kèm giá trị mặc định `开局`(3637/3655/3872) và `待定`(3638/3656/3873).

Tên đề xuất: `the_gioi` / `thoi_gian` / `dia_diem` / `thien_cam`
(**không dấu, không khoảng trắng** — path JSONPatch dùng `/` phân cấp, tên có dấu vẫn chạy nhưng
dễ lỗi khi LLM gõ lại; không dấu an toàn hơn).

Nếu bạn vẫn muốn giữ tên tiếng Trung thì cũng được — chỉ cần **nhất quán cả 6 chỗ**.

---

## 6. 🆕 Ba cái bẫy chỉ xuất hiện ở hướng B

### 6.1 Ngưỡng chia đoạn tính bằng "chữ Hán" — sẽ nổ với tiếng Việt

```js
4700: function Xo(n, e = 2e4)                     // cắt tư liệu thành đoạn 20.000 ký tự
4740: for (; (t.length > 1 || t.join("\n\n").length > 2e4) && a < 8; )   // tối đa 8 vòng
4755, 4788, 4873, 4932: "压缩到约 12000 汉字以内"   // bảo LLM nén xuống < 12.000 chữ Hán
```

1 chữ Hán ≈ 1 từ. 1 ký tự tiếng Việt ≈ 1/5 từ. Cùng lượng thông tin, bản tiếng Việt dài
**gấp ~2,5–3 lần** về số ký tự.

→ Hậu quả nếu để nguyên `2e4`:
- Tư liệu vốn gọn trong 1 đoạn giờ bị cắt thành 3 → **3 lần gọi LLM thay vì 1**, mỗi vòng chưng cất.
- Dễ chạm trần `a < 8` vòng → app báo lỗi hoặc trả về nội dung cụt.
- Tiền API và thời gian chờ tăng theo.

**Cần sửa:** `2e4` → `5e4`, và `12000 汉字` → `khoảng 30.000 ký tự`. (Đây là **sửa code**, không phải dịch.)

### 6.2 `.slice(0, 80)` cho phần tóm tắt nhanh

```js
4565: ).slice(0, 80);                                              // hàm ko()
5158: `- 名称: …\n  简述: ${Zo((Ko(s) || e).slice(0, 80))}`          // fallback 角色速览
```

80 chữ Hán ≈ 1 câu đầy đủ. 80 ký tự tiếng Việt ≈ 12–15 từ, cụt giữa chừng.
→ Nâng lên **200**.

### 6.3 Thông báo lỗi bị parse ngược bằng regex — coupling ẩn

Đây là cái dễ hỏng âm thầm nhất trong cả file.

```js
4570/4732 (ném lỗi):  `${n}包含工程词或占位内容：${label}（${match}），需重新生成`
                                                        ↓ ném ra dưới dạng Error.message
6154 (bắt lại, parse):  n.matchAll(/（([^）]+)）/gu)              ← ngoặc TOÀN GIÁC
6160:                   /工程词|占位内容|模板词|工程占位词/u.test(n)  ← dò từ khóa tiếng Trung
                                                        ↓ tạo avoidTerms
4577 (đưa vào prompt):  `上次生成因为出现这些工程/占位表达而失败：${e.join("、")}`
```

Chuỗi lỗi ở 4732 **vừa hiện cho người dùng, vừa là dữ liệu** cho regex ở 6154.

Nếu dịch 4732 sang tiếng Việt và đổi `（）` toàn giác thành `()` thường → regex 6154 không khớp →
`avoidTerms` luôn rỗng → **vòng thử lại mất hết tác dụng**, AI lặp lại đúng lỗi cũ mãi.
Và **không có thông báo lỗi nào** — nó hỏng im lặng.

**Cách sửa đúng:** đừng parse chuỗi. Ném `Error` kèm thuộc tính:
```js
const err = new Error(`… ${label} (${match}) …`);
err.avoidTerms = [match];      // hoặc [label]
throw err;
```
rồi ở 6154 đọc `e.avoidTerms` thay vì regex. Sửa xong thì dịch thoải mái.
Nếu không muốn sửa code thì phải **giữ nguyên `（）` toàn giác và các từ khóa `工程词|占位内容`**
trong chuỗi tiếng Việt — xấu nhưng chạy được.

---

## 7. Blacklist chống-placeholder phải viết lại cho tiếng Việt

Dòng **4393–4409**. Đây là bộ lọc bắt AI sinh lại khi output có từ "công trình"/placeholder.
`pattern` hiện khớp tiếng Trung — khi AI trả lời tiếng Việt thì **không bao giờ khớp** → mất tác dụng.

Bản đề xuất:

| label (dịch) | pattern hiện tại | pattern cho tiếng Việt |
|---|---|---|
| Chờ bổ sung | `/待补充/u` | `/chờ bổ sung\|cần bổ sung\|sẽ bổ sung\|TBD\|TODO/iu` |
| Người dùng tự viết | `/用户手写/u` | `/người dùng tự (viết\|điền\|nhập)/iu` |
| Từ nội bộ | `/当前任务/u` | `/nhiệm vụ (hiện tại\|này)\|tác vụ hiện tại/iu` |
| Tên công cụ | `/一键角色卡写卡器/u` | tên công cụ sau khi dịch |
| Từ placeholder | `/模板\|提示词\|工程词\|占位符\|placeholder/iu` | `/mẫu\|template\|prompt\|chỗ trống\|placeholder\|\.\.\.\|xxx/iu` |
| Tag nội bộ | regex tag XML | **giữ nguyên** (tag vẫn tiếng Anh) |
| Tag tác vụ nội bộ | `/one_click_card_writer_task\|…/iu` | **giữ nguyên** |
| Từ quy trình front-end | `/前端会\|工具会\|生成器\|代码会/u` | `/(giao diện\|công cụ\|hệ thống\|code) sẽ/iu` |

⚠️ Cẩn thận: pattern quá rộng (`/mẫu/`) sẽ khớp nhầm nội dung hợp lệ ("mẫu người", "khuôn mẫu")
→ app bắt sinh lại vô hạn. **Phải test với output thật trước khi chốt.**

Dòng 6161 cũng có danh sách cứng `["模板","提示词","工程词","占位符","placeholder"]` — dịch kèm.

---

## 8. Ép AI trả lời tiếng Việt — chèn ở đâu

Chỉ dịch prompt là chưa đủ, cần một chỉ thị ngôn ngữ rõ ràng, vì model dễ trôi về tiếng Anh.

Chỗ hiệu quả nhất, theo thứ tự:

1. **Prompt id=4 `🐍 秋青子身份`** (1.223 ký tự, dòng 4244) — đây là persona system prompt,
   thêm 1 dòng: *"Toàn bộ nội dung trong `<content>` phải viết bằng tiếng Việt."*
2. **Hàm `no()` id=44** (dòng 4278–4293) — khối "输出格式要求（强制执行）" hardcode trong code.
   Thêm vào phần `铁律：` (dòng 4290).
3. **Câu prefill id=48** (dòng 4305) — `好的，我都理解了…`. Đổi sang tiếng Việt sẽ **kéo mạnh**
   ngôn ngữ output, vì đây là lượt assistant giả lập mở đầu.
4. Các lệnh `"输出紧凑中文 YAML"` (4755, 4788, 4821, 4873, 4932) → `"YAML tiếng Việt gọn"`.

Lưu ý: **key trong YAML nên giữ tiếng Việt không dấu** (`ten:`, `mo_ta:`) chứ đừng để có dấu —
YAML có dấu vẫn hợp lệ nhưng dễ vỡ khi LLM gõ lại thiếu dấu.

---

## 9. Cảnh báo về chất lượng (không phải lỗi kỹ thuật)

Preset này (`明月秋青写卡`) được tinh chỉnh rất kỹ cho **văn phong sáng tác tiếng Trung** —
ẩn dụ `调色盘` (bảng màu tính cách), `二次解释`, `三面性`. Đây là những khái niệm có sức nặng
trong cộng đồng viết thẻ tiếng Trung.

Dịch nguyên văn sang tiếng Việt thì LLM vẫn hiểu, nhưng **chất lượng output có thể giảm** vì
model được huấn luyện nhiều hơn với các mẫu này ở tiếng Trung.

**Đề xuất test trước khi dịch hết:** thử **1 dòng** thay đổi — thêm
*"Viết toàn bộ nội dung bằng tiếng Việt"* vào prompt id=4, **giữ nguyên mọi prompt tiếng Trung còn lại**,
rồi sinh thử 1 thẻ. Nếu output tiếng Việt đã đủ tốt thì tiết kiệm được ~22.000 ký tự công dịch.
Nếu chưa tốt thì mới dịch toàn bộ theo kế hoạch này.

Đây là **1 giờ test đổi lấy vài ngày công** — nên làm trước.

---

## 10. Font — chọn xong

Kiểm tra: file **không có `@font-face` cũng không có `@import`** nào. Nghĩa là các font
`Noto Sans SC` / `Source Han Sans SC` / `Microsoft YaHei UI` chỉ dùng được nếu máy người dùng
**đã cài sẵn**. Máy Việt Nam thường không có → rơi về `sans-serif` mặc định, tiếng Việt hiển thị bình thường.

Nhưng máy nào có cài font CJK (khá nhiều người dùng SillyTavern) thì dấu tiếng Việt sẽ vỡ.

### Đề xuất

**Be Vietnam Pro** — font Google Fonts do người Việt thiết kế riêng cho tiếng Việt,
dấu thanh đặt cao và tách bạch, đọc tốt ở cỡ chữ nhỏ (mà app này dùng rất nhiều `font-size: 10px`).

```css
/* thay 3 stack ở dòng 34 */
--font-sans:  'Be Vietnam Pro', 'Inter', -apple-system, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
--font-serif: 'Lora', Georgia, 'Times New Roman', 'Noto Serif SC', serif;
--font-mono:  'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace;

/* status bar, dòng 3725 */
font-family: 'Be Vietnam Pro', -apple-system, 'Segoe UI', Roboto, sans-serif;
```

Giữ `Noto Sans SC` ở **cuối** stack để phần xem trước prompt tiếng Trung vẫn hiển thị đúng.

Về nạp font: extension chạy trong iframe của SillyTavern nên `@import` Google Fonts **có thể bị chặn**
tùy cấu hình. An toàn nhất là stack trên — nếu không tải được Be Vietnam Pro thì
Segoe UI / SF / Roboto đều phủ đủ tiếng Việt. Nếu muốn chắc chắn có Be Vietnam Pro thì nhúng
base64 woff2 (~40 KB/weight, 2 weight là đủ).

### Kèm theo — phải sửa CSS

| Việc | Số chỗ |
|---|---:|
| `line-height` < 1.4 → tối thiểu **1.5** (dấu mũ + dấu thanh chồng nhau) | 14 |
| `font-size` ≤ 10px → tối thiểu **11px** | 194 |
| `white-space: nowrap` → bỏ ở nhãn nhiều chữ, giữ ở badge/số | 42 |
| `height: NNpx` cố định → `min-height` | 130 |
| `letter-spacing` dương trên chữ Latin → giảm hoặc bỏ | 28 |

---

## 11. Thứ tự làm đề xuất

1. **Test 1 dòng** (§9) — quyết định có cần dịch prompt không. ← làm đầu tiên
2. Sửa code trước khi dịch: ngưỡng `2e4`/`12000` (§6.1), `slice(0,80)` (§6.2),
   bỏ parse-chuỗi-lỗi (§6.3). Đây là sửa logic, không đụng chữ.
3. Font + CSS (§10) — làm sớm để lúc dịch còn thấy được chỗ nào tràn.
4. Dịch giao diện (610 chuỗi, ~8.400 ký tự).
5. Việt hóa tên biến MVU (§5) — 6 chỗ, 1 commit.
6. Viết lại blacklist (§7) + test với output thật.
7. Dịch prompt (§3) — nếu bước 1 cho thấy cần.
8. Chèn chỉ thị ngôn ngữ (§8).
9. Sinh thử 3–5 thẻ đủ luồng: thế giới quan → nhân vật → lời mở đầu → status bar.

---

## 12. Còn lại cần bạn xác nhận

1. **Tên biến MVU**: Việt hóa (`thien_cam`) hay giữ `好感度`? (§5)
2. **Có làm bước test 1 dòng ở §9 trước không?** — ảnh hưởng ~22.000 ký tự công việc.
3. **Tên công cụ** `一键角色卡写卡器` / `玉藻写卡器` — dịch, phiên âm, hay giữ nguyên?
   Nó xuất hiện 25 lần trong UI **và** trong blacklist `pattern` (4396) **và** trong
   `console.warn` (4050, 4096).
4. Có tự host lại ảnh GIF `i.postimg.cc` không? (§1.1)
