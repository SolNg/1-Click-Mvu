# 1-Click-MVU — rà soát bản dịch giao diện

Repo này chứa bản đã format và tài liệu rà soát trước khi Việt hóa extension
SillyTavern `小玉藻写卡器1.0` (Tamamo Card Writer / 1-Click MVU).

## Nội dung

| File | Mô tả |
|---|---|
| `src/index.vi.js` | **Bản đã Việt hóa** — dựng bằng `./tools/build.sh` |
| `src/index.formatted.js` | Bundle gốc (4,58 MB, 1 dòng) đã format bằng prettier → 7.487 dòng |
| `docs/i18n-status.md` | **Trạng thái bản dịch** — đã làm gì, còn gì, thay đổi hành vi nào |
| `i18n/` | Bản dịch theo lô (`vi/*.json`), preset (`preset/*.txt`), danh sách chuỗi khóa |
| `tools/` | Pipeline trích / áp / vá / kiểm tra |
| `docs/i18n-plan.md` | **Kế hoạch đã chốt (hướng B)** — đọc file này trước |
| `docs/i18n-review.md` | Báo cáo rà soát gốc — bản đồ file, phân loại chuỗi, rủi ro layout |
| `docs/i18n-glossary.md` | Bảng thuật ngữ nháp + quy ước dấu câu |
| `docs/i18n-inventory.tsv` | 883 chuỗi tiếng Trung, có số dòng + phân loại + hành động |

## Trạng thái

**Đã Việt hóa xong.** Kết quả ở `src/index.vi.js`.

- 926/926 chuỗi trong code
- 57/58 prompt preset (xem `docs/i18n-status.md` về prompt id 20)
- Đã đổi đồng bộ tên biến MVU, sửa ngưỡng chia đoạn, viết lại blacklist, đổi font

Chi tiết đầy đủ: `docs/i18n-status.md`.

## Dựng lại

```bash
./tools/build.sh
```

Chạy lần lượt: gộp bản dịch → áp theo offset AST → vá code → chèn CSS → ghi preset →
9 vòng kiểm tra (acorn + babel + so cấu trúc AST + chuỗi khóa + CSS + mã hoá).

## Cách format lại

```bash
prettier --print-width 120 --parser babel <bundle.js> > src/index.formatted.js
```

## Cách dựng lại bảng kê chuỗi

Bảng `docs/i18n-inventory.tsv` được sinh bằng AST (`@babel/parser` + `@babel/traverse`),
duyệt mọi `StringLiteral`/`TemplateLiteral` có chứa ký tự Hán, rồi phân loại theo
vùng dòng và danh sách override thủ công cho các chuỗi rủi ro cao.

Cột: `line`, `category`, `action`, `context` (vị trí AST), `note`, `text`.

Giá trị `action`:

| Giá trị | Số chuỗi | Nghĩa |
|---|---:|---|
| `DICH` | 779 | Dịch bình thường |
| `DOI DONG BO 6 CHO` | 35 | Tên biến MVU — sửa đủ 6 vị trí trong 1 commit (plan §5) |
| `DICH (giu prefix)` | 15 | Tên entry world book — giữ `[initvar]` / `[mvu_update]` |
| `KHOA` | 11 | Tag giao thức, URL CDN, token phân đoạn |
| `VIET LAI PATTERN` | 8 | Blacklist — dịch `label`, viết lại `pattern` (plan §7) |
| `DOI CUNG LUC …` | 8 | Sentinel — đổi mọi chỗ cùng lúc hoặc không đổi |
| `DICH DUOC` | 6 | Trước đây bị khóa, giờ mở vì không cần tương thích thẻ cũ |
| `DICH + SUA SO` | 4 | Ngưỡng `12000 汉字` phải tính lại (plan §6.1) |
| `SUA CODE` / `SUA CODE TRUOC` | 3 | Sửa logic trước khi dịch (plan §6) |
| `GIU id…` | 4 | UUID và URL ảnh trong JSON script |
| `DICH 15/58 PROMPT` | 1 | Preset — chỉ 15 prompt được gửi thật (plan §2) |
| `KHONG-DICH` | 2 | Không phải chuỗi người dùng thấy |
