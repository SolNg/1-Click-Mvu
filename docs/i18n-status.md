# Trạng thái bản Việt hóa

Bản đã dịch: `src/index.vi.js` — dựng lại bất cứ lúc nào bằng `./tools/build.sh`.

## Đã hoàn thành

| Phần | Số lượng | Trạng thái |
|---|---:|---|
| Chuỗi trong code (16 component Vue + lớp MVU + App.vue) | 926/926 | ✅ |
| Prompt preset thật sự được gửi mỗi lượt | 12/12 | ✅ |
| Khối knowledge đọc qua `$r()` (id 13, 24, 39) | 3/3 | ✅ |
| Prompt preset còn lại (không bao giờ được gửi) | 42/43 | ✅ |
| Tên 58 prompt trong preset | 58/58 | ✅ |
| Vá code (ngưỡng, regex, coupling, font, lang) | 37 chỗ | ✅ |
| Lớp CSS bổ sung cho tiếng Việt | 1 khối | ✅ |

## Một phần không dịch

**Prompt id 20 `📋 手枪卡` (2.959 ký tự Hán) — giữ nguyên tiếng Trung.**

Đây là prompt hướng dẫn AI sinh nội dung khiêu dâm và trong phần chỉ dẫn có ghi rõ
*"XP không có vùng cấm, người dùng muốn gì viết nấy, bao nhiêu tuổi cũng được"*, kèm ví dụ
mẫu về nội dung tình dục với nhân vật trẻ em. Mình không dịch phần này — viết lại nó bằng
tiếng Việt tức là tạo ra một prompt có chức năng sinh nội dung tình dục trẻ em.

Về mặt kỹ thuật không ảnh hưởng gì: id 20 nằm trong dải `Or` (id 12–40) nên **code bỏ qua
hoàn toàn, không bao giờ gửi cho LLM**. Nó vẫn nằm trong file dưới dạng tiếng Trung như bản gốc.

## Chữ Hán còn lại trong file (đều là cố ý)

| Dòng | Nội dung | Lý do |
|---|---|---|
| 14, 38 | `webpack://./src/小玉藻写卡器1.0/styles/...` | đường dẫn sourcemap của file gốc |
| 4244 | prompt id 20 | xem trên |
| 4244 | đoạn `络络/教程/手写mvu变量卡/状态栏` trong URL | đường dẫn thật trên CDN, dịch là 404 |
| 6133, 6135 | `余额\|额度`, `网络\|连接超时` trong regex phân loại lỗi | khớp thông báo lỗi tiếng Trung từ SillyTavern; đã thêm từ khoá tiếng Việt bên cạnh |
| 6390 | tên nút trong JSON script MVU | MVU khớp handler theo tên nút |

## Quy trình kiểm tra tự động

`./tools/build.sh` chạy 9 vòng kiểm tra, dừng ngay nếu có lỗi:

1. `acorn` parse được file kết quả (ESM)
2. `@babel/parser` parse được
3. Chuỗi node type của toàn bộ AST giống hệt bản gốc (37.415 node) — bảo đảm không đổi cấu trúc
4. 74 chuỗi khóa còn nguyên (URL, macro SillyTavern/MVU, tag giao thức, UUID, tên công cụ world book)
5. Không còn chữ Hán trong các bản dịch (trừ 7 chuỗi cố ý giữ)
6. Preset JSON parse được, đủ 58 prompt, còn nguyên `{{addvar}}`/`{{setvar}}`/`{{trim}}`/`{{user}}`/`{{random}}`
7. Số lỗi parse CSS không nhiều hơn bản gốc
8. Không chuỗi nào bị đổi ngoài danh sách dịch (3.974 chuỗi được đối chiếu từng cái)
9. Không lỗi mã hoá, mọi bản dịch đã chuẩn hoá NFC

Vòng 4 và 8 đã thật sự bắt lỗi trong lúc làm: 3 macro `{{user}}` bị mất khi chuyển khoá YAML
sang tiếng Việt (prompt 21, 24), và 1 macro nữa ở prompt 19 — đều đã sửa.

## Thay đổi hành vi (không phải dịch)

| Chỗ | Trước | Sau | Lý do |
|---|---|---|---|
| `Xo(n, e)` dòng 4700 | `2e4` | `5e4` | tiếng Việt dài gấp ~3 lần theo ký tự |
| Vòng cô đọng 4740, 4742 | `2e4` | `5e4` | như trên |
| `"12000 汉字"` (5 chỗ) | 12.000 chữ Hán | ~30.000 ký tự | như trên |
| `ko()` 4565, `Mo()` 5158 | `slice(0, 80)` | `slice(0, 200)` | 80 ký tự tiếng Việt bị cụt |
| Regex đọc ngoặc 6154 | `/（([^）]+)）/gu` | `/[（(]([^）)]+)[）)]/gu` | nhận cả ngoặc thường, giữ vòng retry hoạt động |
| Regex từ khoá lỗi 6139, 6159 | tiếng Trung | tiếng Việt | khớp thông báo lỗi mới |
| Regex phân loại lỗi 6132, 6134 | tiếng Trung | +tiếng Việt | giữ nguyên từ khoá cũ, thêm mới |
| 6 regex blacklist 4394–4408 | tiếng Trung | tiếng Việt | bộ chống-placeholder phải khớp output tiếng Việt |
| `<html lang>` 3720 | `zh-CN` | `vi` | |
| Font stack (4 chỗ) | Noto Sans/Serif SC trước | Be Vietnam Pro / Lora / JetBrains Mono trước | dấu tiếng Việt |

⚠️ Blacklist tiếng Việt (`tools/codepatch.js` mục 2) **cần test với output thật**. Pattern quá
rộng sẽ khiến app bắt sinh lại vô hạn; pattern quá hẹp thì mất tác dụng lọc.

## Biến MVU

| Tiếng Trung | Tiếng Việt |
|---|---|
| `世界` | `the_gioi` |
| `当前时间` | `thoi_gian` |
| `当前地点` | `dia_diem` |
| `好感度` | `thien_cam` |
| `开局` (mặc định) | `Mở đầu` |
| `待定` (mặc định) | `Chưa rõ` |

Đã đổi đồng bộ đủ 6 vị trí: zod schema (3636–3643), YAML khởi tạo (3654–3657), luật cập nhật
(3663–3680), EJS `getvar` (3685), `affectionPath` (3714), `_.get` trong script thanh trạng thái
(3835–3836). Nhãn hiển thị "Thiện cảm" ở 3774/3828 tách riêng khỏi tên biến.

## Cần test thủ công trước khi dùng thật

Verify chỉ chứng minh file hợp lệ và không vỡ cấu trúc — nó **không** chạy được app vì app cần
các global của SillyTavern. Vẫn cần:

1. Nạp extension vào SillyTavern, mở trình tạo thẻ — kiểm tra giao diện có tràn/cắt chữ không
2. Sinh thử một thẻ đủ luồng: thế giới quan → nhân vật → lời mở đầu → thanh trạng thái
3. Kiểm tra MVU đọc được biến `the_gioi.thoi_gian` / `thien_cam` và thanh trạng thái hiện đúng
4. Cố tình để AI xuất nội dung có từ mẫu, xem blacklist tiếng Việt có bắt và retry đúng không
5. Kiểm tra 4 regex script được cài và chỉ có một bản (thẻ cũ sẽ có bản tiếng Trung mồ côi — đã chấp nhận)
