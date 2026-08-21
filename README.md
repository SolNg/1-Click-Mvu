# 1-Click-MVU — rà soát bản dịch giao diện

Repo này chứa bản đã format và tài liệu rà soát trước khi Việt hóa extension
SillyTavern `小玉藻写卡器1.0` (Tamamo Card Writer / 1-Click MVU).

## Nội dung

| File | Mô tả |
|---|---|
| `src/index.formatted.js` | Bundle gốc (4,58 MB, 1 dòng) đã format bằng prettier → 7.487 dòng |
| `docs/i18n-review.md` | **Báo cáo rà soát** — chỗ nào dịch được, chỗ nào khóa, rủi ro |
| `docs/i18n-glossary.md` | Bảng thuật ngữ nháp + quy ước dấu câu |
| `docs/i18n-inventory.tsv` | 883 chuỗi tiếng Trung, có số dòng + phân loại + hành động |

## Trạng thái

Mới ở **bước rà soát**. Chưa dịch chuỗi nào.
Bước tiếp theo cần chốt 4 câu hỏi ở §8 của `docs/i18n-review.md`.

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

| Giá trị | Nghĩa |
|---|---|
| `DICH` | Dịch bình thường |
| `DICH KEM` / `DICH CO DIEU KIEN` | Dịch nhưng phải xem ghi chú |
| `CHI DICH label` | Chỉ dịch trường `label`, không đụng `pattern` |
| `DOI CUNG LUC` | Sentinel — phải đổi mọi chỗ cùng lúc hoặc không đổi |
| `CAN THAN` | Tên file / tên script ghi ra ngoài |
| `KHOA` | Không được dịch (biến MVU, tag giao thức, prefix, script_name) |
| `QUYET DINH RIENG` | Prompt gửi cho LLM — quyết định ở §5 báo cáo |
| `KHONG-DICH` | Không phải chuỗi người dùng thấy |
