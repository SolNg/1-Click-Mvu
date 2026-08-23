# Bản mod — dùng công cụ trên thẻ/world book đã có sẵn

`src/index.mod.js` là **bản Việt hóa cộng thêm một quy trình mới**: *“Mod thẻ có sẵn”*.

Bản gốc bắt buộc phải tạo mọi thứ từ đầu (thế giới quan → nhân vật → lời mở đầu → MVU).
Bản mod thêm một lối vào thứ tư: chọn một thẻ nhân vật đã làm chỉn chu rồi **chỉ gắn thêm
phần MVU / zod / thanh trạng thái**, không gọi AI, không sinh lại bất kỳ nội dung nào.

## Bản mod làm gì

Sau khi bấm **Mod thẻ có sẵn** ở màn hình đầu, có 5 phần có thể bật/tắt riêng:

| Phần | Ghi vào đâu | Nội dung |
|---|---|---|
| Khối biến MVU | World book đích | `[initvar]Khởi tạo biến - đừng bật`, `Danh sách biến`, `[mvu_update]Luật cập nhật biến`, `[mvu_update]Định dạng xuất biến`, `[mvu_update]Nhấn mạnh định dạng xuất biến` |
| Script runtime MVU | `extensions.tavern_helper.scripts` | script tên `MVU`, nạp `MagVarUpdate/artifact/bundle.js` |
| Script cấu trúc biến (zod) | `extensions.tavern_helper.scripts` | script tên `Cấu trúc biến`, gọi `registerMvuSchema` |
| Regex thanh trạng thái | `extensions.regex_scripts` | 6 regex: lọc `<Analysis>`, gói `<UpdateVariable>`, 2 regex làm đẹp, ẩn + vẽ `<StatusPlaceHolderImpl/>` |
| Gắn thanh trạng thái vào lời mở đầu | `first_messages[0]` (tùy chọn: cả danh sách) | nối `<StatusPlaceHolderImpl/>` vào cuối, **không sửa chữ đã viết** |

Biến sinh ra giống hệt bản gốc: `the_gioi.thoi_gian`, `the_gioi.dia_diem`, và
`<tên nhân vật>.thien_cam` (0–100) cho mỗi tên trong danh sách.

## Vì sao an toàn với thẻ đã làm kỹ

Bản mod dùng lại đúng những hàm ghi của bản gốc, và các hàm đó vốn đã ghi **thêm**
chứ không ghi **đè** cả sách:

- `Ai()` chỉ xóa mục thỏa **cả hai**: `extra.source` là của chính công cụ này **và** trùng tên
  với mục sắp ghi. Mục bạn tự viết không bao giờ bị đụng.
- `Rr()`/`Qr()` chỉ thay script trùng tên/id (`MVU`, `Cấu trúc biến`), script khác giữ nguyên.
- `oi()` chỉ thay regex trùng `script_name`, regex khác giữ nguyên.
- `description`, `personality`, `scenario`, ảnh bìa: **không đụng tới**.
- Bước `clear-old` (xóa toàn bộ nội dung công cụ từng tạo) **không có** trong quy trình mod.

Chạy lại lần hai không nhân đôi bất cứ thứ gì — đã kiểm chứng trong `tools/smoke/mod.js`.

Vẫn nên tự sao lưu thẻ trước khi chạy: bản mod không tạo điểm khôi phục như quy trình đầy đủ.

## Nút “Dò từ thẻ có sẵn”

Tự điền danh sách nhân vật, theo thứ tự ưu tiên:

1. Đọc mục `[initvar]` trong world book đích → lấy các khóa cấp 1 (bỏ `the_gioi` và `世界`).
2. Nếu không có, đọc script `registerMvuSchema` trong thẻ → lấy các khóa `z.object(`.
3. Nếu vẫn không có, điền sẵn tên thẻ.

Nhờ bước 1 mà thẻ *đã* dùng MVU (kể cả thẻ Trung dùng khóa `世界`) vẫn dò đúng.

## Sống chung với bản gốc

Cài song song hai bản trong SillyTavern được, vì bản mod đổi 3 định danh:

| | Bản Việt hóa | Bản mod |
|---|---|---|
| Nút script | `Trình tạo thẻ nhân vật một chạm` | `Trình tạo thẻ nhân vật một chạm (mod)` |
| Khóa localStorage | `tamamo-card-writer:draft:v1:` | `tamamo-card-writer-mod:draft:v1:` |
| Kho IndexedDB | `one-click-card-writer` | `one-click-card-writer-mod` |

Ngoài 3 chỗ đó, mọi chuỗi và mọi nút AST của bản Việt hóa đều còn nguyên trong bản mod
(`tools/verify-mod.js` mục 2 và 3 kiểm đúng điều này).

## Dựng lại

```bash
./tools/build.sh       # dựng src/index.vi.js trước (nếu đổi bản dịch)
./tools/check-mod.sh   # dựng src/index.mod.js + kiểm tra tĩnh + chạy thật trong Chromium
./tools/build-mod.sh   # chỉ dựng + kiểm tra tĩnh
node tools/smoke/shot-mod.js   # chụp ảnh màn hình mod để xem bằng mắt
```

`tools/modpatch.js` là toàn bộ phần khác biệt. Nó chèn 14 điểm qua AST, mỗi điểm đều
kiểm tra số lượng khớp và dừng ngay nếu sai:

1. Chèn component `QzModView` (nguồn ở `tools/mod/modview.src.js`) vào ngay trước component `App`.
2. Thêm `"enter-mod"` vào `emits` của `SetupView`.
3. Thêm nút quy trình thứ tư vào `SetupView`.
4. Nhân bản hàm “về màn hình đầu” thành `qzEnterModView` (`F.value = "mod"`), gắn vào prop `onEnterMod`.
5. Thêm nhánh render `"mod" === F.value` vào cây điều kiện của `App`.
6. Thêm nhãn/tiêu đề/mô tả cho màn hình mod vào 3 `computed` của thanh tiêu đề.
7. Đổi 3 định danh ở bảng trên.

## Kiểm tra đã chạy

`tools/verify-mod.js` (tĩnh):

1. `acorn` và `@babel/parser` đều phân tích được.
2. Mọi chuỗi của bản Việt hóa còn nguyên — đúng 3 chuỗi được đổi tên có chủ ý.
3. Toàn bộ 37.415 nút AST của bản Việt hóa vẫn nằm trong bản mod (kiểm tra dãy con).
4. Không chuỗi mới nào lọt chữ Hán (trừ `世界` để nhận diện thẻ cũ, và JSON runtime MVU vốn đã có).
5. Đếm đúng số điểm nối: 1 khai báo `QzModView`, 1 chỗ dùng, 1 `emits`, 1 `onClick`, 1 prop, 1 hàm, 4 lần so `"mod"`.
6. 13 hàm dùng chung (`Er`, `ur`, `hr`, `Ai`, `oi`, `Dr`, `Rr`, `Hr`, `Wr`, `Vr`, `zr`, `Fo`, `Pr`) đều tồn tại thật.

`tools/smoke/mod.js` (chạy thật trong Chromium, global SillyTavern giả lập với thẻ *đã có*
lời mở đầu, regex riêng, script riêng và world book có mục người dùng tự viết):

- nút script mang tên riêng của bản mod;
- màn hình đầu có 4 quy trình, bấm được vào quy trình mod;
- màn hình mod render 4 panel, 7 ô chọn, tự dò tên nhân vật;
- bấm chạy → gọi đúng `updateWorldbookWith` / `createWorldbookEntries` / `updateCharacterWith` / `updateTavernRegexesWith`;
- **không tạo thêm world book mới** khi thẻ đã có sách chính;
- mục người dùng tự viết, regex riêng, script riêng đều còn;
- thêm đúng 5 mục MVU, đủ tiền tố `[initvar]` và `[mvu_update]`;
- lời mở đầu chỉ được nối thêm thẻ, chữ cũ nguyên vẹn, lời chào thay thế không bị đụng;
- chạy lần hai không nhân đôi gì;
- dò lại từ `[initvar]` vừa ghi ra đúng tên nhân vật;
- không lỗi JS; layout sạch ở 1600/1280/900/390px.

## Còn chưa kiểm được

Giống bản Việt hóa: chưa chạy trên SillyTavern thật. Cụ thể với bản mod, bạn nên tự thử:

- chạy trên một thẻ thật rồi mở lại đoạn chat, xem thanh trạng thái có hiện `thien_cam` không;
- nếu thẻ đã có sẵn MVU của người khác, kiểm tra tên biến cũ có bị lẫn với tên biến mới không
  (nút “Dò từ thẻ có sẵn” chỉ đọc mục `[initvar]` do công cụ này hoặc MVU chuẩn tạo).
